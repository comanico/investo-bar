# ==========================================================
# INVESTO SOCIETY — BEER MARKET SIMULATION (with Random Crisis)
# ==========================================================
# A clean, single-sector beer market simulator.
# Prices evolve based on demand and react to crisis shocks (spike or time-based).
# ==========================================================

# ---- Libraries ----
library(shiny)
library(googlesheets4)
library(dplyr)
library(tidyr)
library(ggplot2)
library(DT)
library(jsonlite)

# ==========================================================
# ================== SETTINGS (PARAMETERS) ==================
# ==========================================================

# --- Persist JSON history ---
WRITE_JSON <- TRUE
JSON_PATH <- "./JSON/beer_live_prices.json"

# ---- MySQL Connection Settings ----
DATABASE_URL <- ""

# Helper to parse DB URL
parse_db_url <- function(url) {
  url <- sub("^mysql://", "", url)
  parts <- strsplit(url, "@")[[1]]
  if (length(parts) != 2) stop("Invalid DB URL format")

  creds <- strsplit(parts[1], ":")[[1]]
  host_port_db <- strsplit(parts[2], "/")[[1]]
  host_port <- strsplit(host_port_db[1], ":")[[1]]
  dbname <- host_port_db[2]

  list(
    username = creds[1],
    password = creds[2],
    host = host_port[1],
    port = as.integer(host_port[2]),
    dbname = dbname
  )
}

db_config <- parse_db_url(DATABASE_URL)

# --- Base Prices (Fundamentals) ---
BASE_PRICES <- c(
  Heineken = 10,
  Peroni   = 11,
  Corona   = 12
)

if (!file.exists(JSON_PATH)) {
  json_row <- data.frame(Interval = "T0", as.list(BASE_PRICES), stringsAsFactors = FALSE) # nolint: line_length_linter.
  json_row <- rbind(json_row)
  write_json(json_row, JSON_PATH, pretty = TRUE, auto_unbox = TRUE)
}

# --- Crisis Logic Parameters ---
CRISIS_MODE <- "time_or_spike" # "time_or_spike" | "time_only" | "spike_only"
CRISIS_WINDOW <- c(12L, 14L) # Window in which crisis may occur
CRISIS_MULTIPLIER <- 2.0 # Crisis when any beer > 2× base
CRISIS_LABEL <- "CRISIS"
SHOW_CRISIS_LINE <- TRUE

# --- Market Dynamics ---
ALPHA_SHARE <- 0.60 # Sensitivity to relative demand
ABS_IMPACT_WEIGHT <- 0.60 # Sensitivity to absolute demand
LAMBDA <- 0.20 # EMA smoothing for volume
LAMBDA_SHARE <- 0.40 # EMA smoothing for shares
DEPTH <- 10 # Smooth low-demand impact
MAX_CHANGE <- 0.40 # Max percent change per tick
ROUND_TO <- 0.5 # Price rounding step
SOFT_FLOOR_DELTA <- 1.0 # Price won't drop below (base - δ)
PROFIT_OFFSET_PER_UNIT <- 2 # Cost offset per sold unit
UPDATE_INTERVAL_SECONDS <- 180
EPS_SHARE <- 1e-6

# ==========================================================
# ===================== USER INTERFACE ======================
# ==========================================================
ui <- fluidPage(
  tags$head(
    tags$style(HTML("
      body {background:#111; color:#eee; font-family:'Segoe UI'; padding:20px;}
      #mainTitle {text-align:center; font-size:40px; font-weight:bold; color:#00f5d4; margin-top:10px;}
      #subTitle {text-align:center; font-size:20px; margin-bottom:20px; color:#f0f0f0;}
      #countdownTimer {text-align:center; font-size:26px; font-weight:bold; color:#fcbf49; margin-bottom:30px;}
      table {color:#eee;}
    "))
  ),
  div(id = "mainTitle", "Investo Society — Beer Market"),
  div(id = "subTitle", "🍺📈 Live Beer Price Simulation Based on Demand"),
  htmlOutput("countdown"),
  tags$script(HTML("
    function getTimeUntilNext15Minute() {
      const now = new Date();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();

      // Calculate next 15-minute mark (0, 15, 30, 45)
      let next15Minute;
      if (currentMinutes < 15) {
        next15Minute = 15;
      } else if (currentMinutes < 30) {
        next15Minute = 30;
      } else if (currentMinutes < 45) {
        next15Minute = 45;
      } else {
        next15Minute = 60; // Next hour, minute 0
      }

      // Calculate seconds until next 15-minute mark
      const minutesUntil = next15Minute - currentMinutes - 1;
      const secondsUntil = 60 - currentSeconds;
      const totalSeconds = minutesUntil * 60 + secondsUntil;

      return totalSeconds;
    }

    let countdown = getTimeUntilNext15Minute();

    function updateCountdown() {
      if (countdown <= 0) {
        countdown = getTimeUntilNext15Minute();
        // Trigger page refresh when countdown reaches 0
        location.reload();
      }

      let minutes = Math.floor(countdown / 60);
      let seconds = countdown % 60;
      document.getElementById('countdownTimer').innerText =
        '🔁 Următorul update în: ' + minutes + ' minute ' + (seconds < 10 ? '0' : '') + seconds + ' secunde';
      countdown--;
    }

    setInterval(updateCountdown, 1000);
  ")),
  uiOutput("styledPriceTable"),
  plotOutput("pricePlot", height = "520px"),
  br(),
  h3("Detaliu pe perioade (rând = interval | coloane = sortimente × [Price, Quantity])"),
  DTOutput("periodMatrix")
)

# ==========================================================
# ====================== SERVER LOGIC =======================
# ==========================================================
server <- function(input, output, session) {
  # ---------- DB Connection (pooled for Shiny) ----------
  pool <- pool::dbPool(
    RMySQL::MySQL(),
    user = db_config$username,
    password = db_config$password,
    host = db_config$host,
    port = db_config$port,
    dbname = db_config$dbname,
    idleTimeout = 3600000
  )

  onStop(function() {
    pool::poolClose(pool)
  })

  # ---- Utility ----
  safe_rbind <- function(a, b, cols) {
    for (nm in setdiff(cols, names(a))) a[[nm]] <- NA
    for (nm in setdiff(cols, names(b))) b[[nm]] <- NA
    a <- a[, cols, drop = FALSE]
    b <- b[, cols, drop = FALSE]
    rbind(a, b)
  }

  # ---- Initialize State ----
  TARGET_COLS <- c("Index", "Interval", "Event", names(BASE_PRICES), "Profit", "CumProfit")

  sheet_cache <- reactiveVal(NULL)
  last_row <- reactiveVal(0L)
  total_rows <- reactiveVal(0L)
  ema_volumes <- reactiveVal(setNames(rep(0, length(BASE_PRICES)), names(BASE_PRICES)))
  ema_shares <- reactiveVal(setNames(rep(1 / length(BASE_PRICES), length(BASE_PRICES)), names(BASE_PRICES)))
  cum_profit <- reactiveVal(0)
  cum_sold <- reactiveVal(setNames(rep(0, length(BASE_PRICES)), names(BASE_PRICES)))
  current_prices <- BASE_PRICES

  crisis_triggered <- reactiveVal(FALSE)
  crisis_index <- reactiveVal(NA_integer_)
  crisis_random_index <- reactiveVal(sample(CRISIS_WINDOW[1]:CRISIS_WINDOW[2], 1))

  # ---- Initial Data for UI ----
  price_history <- reactiveVal(
    data.frame(
      Index = 0, Interval = "T0", Event = "T0",
      as.list(BASE_PRICES), Profit = 0, CumProfit = 0
    )
  )
  txn_history <- reactiveVal(
    data.frame(
      Index = 0, Interval = "T0", Event = "T0",
      Drink = names(BASE_PRICES), Quantity = 0, Price = as.numeric(BASE_PRICES)
    )
  )

  # ---- Timer ----
  # Calculate time until next 15-minute mark for reactive timer
  getNext15MinuteInterval <- function() {
    now <- Sys.time()
    current_minutes <- as.numeric(format(now, "%M"))
    current_seconds <- as.numeric(format(now, "%S"))

    # Calculate next 15-minute mark
    if (current_minutes < 15) {
      next_15_minute <- 15
    } else if (current_minutes < 30) {
      next_15_minute <- 30
    } else if (current_minutes < 45) {
      next_15_minute <- 45
    } else {
      next_15_minute <- 60 # Next hour, minute 0
    }

    # Calculate milliseconds until next 15-minute mark
    minutes_until <- next_15_minute - current_minutes - 1
    seconds_until <- 60 - current_seconds
    total_seconds <- minutes_until * 60 + seconds_until

    return(total_seconds * 1000) # Convert to milliseconds
  }

  autoInvalidate <- reactiveTimer(getNext15MinuteInterval())
  output$countdown <- renderUI(tags$div(id = "countdownTimer"))

  # ======================================================
  # =============== MAIN DATA OBSERVER ===================
  # ======================================================
  observe({
    autoInvalidate()

    query <- "
      SELECT id, Heineken, Corona, Peroni
      FROM bere
      ORDER BY id DESC
      LIMIT 1
    "

    # ---- Load Data ----
    if (is.null(sheet_cache())) {
      df <- tryCatch(
        {
          DBI::dbGetQuery(pool, query)
        },
        error = function(e) {
          load_error(paste("DB query failed:", e$message))
          return(NULL)
        }
      )

      if (is.null(df) || nrow(df) == 0) {
        load_error("No data in bere table or query failed")
        return()
      }

      names(df) <- trimws(names(df))
      df <- df[, intersect(names(df), names(BASE_PRICES)), drop = FALSE]
      df[] <- lapply(df, function(x) suppressWarnings(as.numeric(x)))
      df[is.na(df)] <- 0
      df <- df[rowSums(df) > 0, , drop = FALSE]
      if (nrow(df) == 0) {
        cat("⚠️ No numeric rows found.\n")
        return()
      }

      cat("✅ Loaded", nrow(df), "rows for", paste(names(df), collapse = ", "), "\n")
      sheet_cache(df)
      total_rows(nrow(df))

      # Initialize EMA baselines
      ema_volumes(sapply(df, median, na.rm = TRUE))
      ema_shares(setNames(rep(1 / length(df), length(df)), names(df)))
    }

    df <- sheet_cache()
    if (is.null(df)) {
      return()
    }
    total <- total_rows()
    if (total == 0) {
      return()
    }

    start <- last_row() + 1L
    if (start > total) {
      return()
    }

    # ---- Process New Rows ----
    for (row_index in seq(start, total)) {
      v_vec <- as.numeric(df[row_index, ])
      v_vec[is.na(v_vec)] <- 0
      names(v_vec) <- names(df)
      if (sum(v_vec) == 0) {
        last_row(row_index)
        next
      }

      # --- EMA updates ---
      ema_prev <- ema_volumes()
      ema_new <- (1 - LAMBDA) * ema_prev + LAMBDA * v_vec
      cum_prev <- cum_sold()
      cum_new <- cum_prev + v_vec
      tot <- sum(v_vec)

      cur_sh <- if (tot > 0) v_vec / tot else ema_shares()
      sh_prev <- ema_shares()
      sh_new <- (1 - LAMBDA_SHARE) * sh_prev + LAMBDA_SHARE * cur_sh

      # --- Price update logic ---
      new_prices <- current_prices
      for (drink in names(BASE_PRICES)) {
        p_t <- current_prices[[drink]]
        b0 <- BASE_PRICES[[drink]]
        s_now <- cur_sh[[drink]]
        s_exp <- sh_new[[drink]]

        denom <- (s_exp * (1 - s_exp)) + EPS_SHARE
        oi_share <- (s_now - s_exp) / denom
        e_vol <- ema_new[[drink]]
        x_vol <- v_vec[[drink]]
        oi_abs <- (x_vol - e_vol) / (e_vol + DEPTH)

        oi <- (ALPHA_SHARE * oi_share) + (ABS_IMPACT_WEIGHT * oi_abs)
        p_new <- exp(log(p_t) + oi)

        ratio <- p_new / p_t
        if (ratio > 1 + MAX_CHANGE) p_new <- p_t * (1 + MAX_CHANGE)
        if (ratio < 1 - MAX_CHANGE) p_new <- p_t * (1 - MAX_CHANGE)
        p_new <- round(p_new / ROUND_TO) * ROUND_TO
        p_new <- max(p_new, b0 - SOFT_FLOOR_DELTA)

        new_prices[[drink]] <- p_new
      }

      # --- Crisis Logic ---
      event_label <- ""
      rand_crisis_idx <- crisis_random_index()

      # Spike crisis (price overheating)
      if ((CRISIS_MODE %in% c("time_or_spike", "spike_only")) &&
        any(unlist(new_prices) > CRISIS_MULTIPLIER * BASE_PRICES) &&
        !crisis_triggered()) {
        new_prices <- BASE_PRICES
        event_label <- CRISIS_LABEL
        crisis_triggered(TRUE)
        crisis_index(row_index)
        cat("🚨 Crisis triggered by price spike at interval", row_index, "\n")
      }

      # Randomized time-based crisis
      if ((CRISIS_MODE %in% c("time_or_spike", "time_only")) &&
        row_index == rand_crisis_idx &&
        !crisis_triggered()) {
        new_prices <- BASE_PRICES
        event_label <- CRISIS_LABEL
        crisis_triggered(TRUE)
        crisis_index(row_index)
        cat("🚨 Random time crisis triggered at interval", row_index, "\n")
      }

      # --- Profit computation ---
      profit_tick <- sum(v_vec * (unlist(new_prices) - (BASE_PRICES - PROFIT_OFFSET_PER_UNIT)))
      cum_profit_new <- cum_profit() + profit_tick

      # --- Commit state ---
      current_prices <<- new_prices
      ema_volumes(ema_new)
      ema_shares(sh_new)
      cum_sold(cum_new)
      cum_profit(cum_profit_new)
      last_row(row_index)

      # --- History update ---
      hist <- price_history()
      new_row <- data.frame(
        Index = row_index, Interval = paste("T", row_index),
        Event = event_label, as.list(new_prices),
        Profit = round(profit_tick, 2), CumProfit = round(cum_profit_new, 2)
      )
      hist <- safe_rbind(hist, new_row, TARGET_COLS)
      price_history(hist)

      detail <- txn_history()
      per_drink <- data.frame(
        Index = row_index, Interval = paste("T", row_index),
        Event = event_label, Drink = names(new_prices),
        Quantity = as.numeric(v_vec[names(new_prices)]),
        Price = as.numeric(unlist(new_prices))
      )
      txn_history(rbind(detail, per_drink))
    }
    # Persist JSON
    if (isTRUE(WRITE_JSON)) {
      dir.create(dirname(JSON_PATH), recursive = TRUE, showWarnings = FALSE)
      if (file.exists(JSON_PATH)) {
        json_data <- tryCatch(jsonlite::fromJSON(JSON_PATH, simplifyDataFrame = TRUE), error = function(e) NULL)
        if (is.null(json_data)) {
          jsonlite::write_json(new_row, JSON_PATH, pretty = TRUE, auto_unbox = TRUE)
        } else {
          if (!is.data.frame(json_data)) json_data <- as.data.frame(json_data, stringsAsFactors = FALSE)
          for (nm in setdiff(TARGET_COLS, names(json_data))) json_data[[nm]] <- NA
          json_data <- json_data[, TARGET_COLS, drop = FALSE]
          combined <- rbind(json_data, new_row)
          jsonlite::write_json(combined, JSON_PATH, pretty = TRUE, auto_unbox = TRUE)
        }
      } else {
        jsonlite::write_json(new_row, JSON_PATH, pretty = TRUE, auto_unbox = TRUE)
      }
    }
  })

  # ======================================================
  # ===================== OUTPUTS ========================
  # ======================================================

  # ---- Price Table ----
  output$styledPriceTable <- renderUI({
    hist <- price_history()
    if (nrow(hist) == 0) {
      return(NULL)
    }
    latest <- tail(hist, 1)
    tbl <- data.frame(
      Bautura = names(BASE_PRICES),
      Pret = as.numeric(latest[1, names(BASE_PRICES)]),
      Delta = as.numeric(latest[1, names(BASE_PRICES)]) - BASE_PRICES
    )
    crisis_badge <- if (nzchar(latest$Event[1])) {
      tags$span(style = "color:red; font-weight:bold;", paste0("🚨 ", latest$Event[1]))
    } else {
      NULL
    }

    tags$table(
      style = "margin:auto; width:60%; border-collapse:collapse; text-align:center;",
      tags$thead(tags$tr(tags$th("Băutură"), tags$th("Preț"), tags$th("Δ vs T0"))),
      tags$tbody(
        lapply(1:nrow(tbl), function(i) {
          tags$tr(
            tags$td(tbl$Bautura[i]),
            tags$td(sprintf("%.2f", tbl$Pret[i])),
            tags$td(sprintf("%+.2f", tbl$Delta[i]))
          )
        }),
        tags$tr(tags$td("Profit interval"), tags$td(colspan = 2, sprintf("%.2f", latest$Profit))),
        tags$tr(tags$td("Profit cumulat"), tags$td(colspan = 2, sprintf("%.2f", latest$CumProfit))),
        tags$tr(tags$td(colspan = 3, style = "text-align:center;", crisis_badge))
      )
    )
  })

  # ---- Price Plot ----
  output$pricePlot <- renderPlot({
    hist <- price_history()
    if (nrow(hist) < 2) {
      return(NULL)
    }
    hist_long <- hist %>% pivot_longer(cols = names(BASE_PRICES), names_to = "Drink", values_to = "Price")
    p <- ggplot(hist_long, aes(Index, Price, color = Drink)) +
      geom_line(size = 1.2) +
      geom_point(size = 2) +
      theme_minimal(base_size = 15) +
      labs(title = "Evoluția prețurilor în timp", x = "Interval", y = "Preț (lei)") +
      theme(
        plot.background = element_rect(fill = "#111", color = NA),
        panel.background = element_rect(fill = "#111", color = NA),
        axis.text = element_text(color = "#ccc"),
        axis.title = element_text(color = "#eee"),
        plot.title = element_text(color = "#fff", hjust = 0.5)
      )
    if (SHOW_CRISIS_LINE && !is.na(crisis_index())) {
      p <- p + geom_vline(xintercept = crisis_index(), linetype = "dashed", color = "red", linewidth = 1.3)
    }
    p
  })

  # ---- Period Matrix ----
  output$periodMatrix <- renderDT({
    df_long <- txn_history()
    if (nrow(df_long) == 0) {
      return(NULL)
    }
    df_long <- df_long %>%
      group_by(Index, Interval, Event, Drink) %>%
      summarise(
        Price = mean(Price, na.rm = TRUE),
        Quantity = sum(Quantity, na.rm = TRUE), .groups = "drop"
      )
    wide <- pivot_wider(df_long,
      id_cols = c(Index, Interval, Event),
      names_from = Drink, values_from = c(Price, Quantity),
      names_glue = "{Drink} {.value}"
    )
    datatable(wide, rownames = FALSE, options = list(pageLength = 10, scrollX = TRUE))
  })
}

# ==========================================================
# ===================== RUN APPLICATION ====================
# ==========================================================
runApp(shinyApp(ui, server))
