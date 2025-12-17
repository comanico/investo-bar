# ==========================================================
# INVESTO SOCIETY — SOFT MARKET SIMULATION
# Rolling JSON Log + Crisis Button + Flash + Sound Alerts
# SQL VERSION (REPLACES GOOGLE SHEETS)
# ==========================================================

library(shiny)
library(shinyjs)
library(DBI)
library(RMySQL)
library(pool)
library(dplyr)
library(tidyr)
library(ggplot2)
library(DT)
library(jsonlite)

# ==========================================================
# SQL SETTINGS
# ==========================================================

DATABASE_URL <- ""

parse_db_url <- function(url) {
  url <- sub("^mysql://", "", url)
  parts <- strsplit(url, "@")[[1]]
  creds <- strsplit(parts[1], ":")[[1]]
  hp <- strsplit(parts[2], "/")[[1]]
  host_port <- strsplit(hp[1], ":")[[1]]
  list(
    username = creds[1],
    password = creds[2],
    host = host_port[1],
    port = as.integer(host_port[2]),
    dbname = hp[2]
  )
}

cfg <- parse_db_url(DATABASE_URL)

pool <- dbPool(
  RMySQL::MySQL(),
  user = cfg$username,
  password = cfg$password,
  host = cfg$host,
  port = cfg$port,
  dbname = cfg$dbname
)

# ==========================================================
# CONSTANTS
# ==========================================================

BASE_PRICES <- c(Vin_Spumant_Fara_Alcool = 12, Apa = 10, Cola = 10)
BOTTLE_COST <- c(Vin_Spumant_Fara_Alcool = 25.00, Apa = 3.50, Cola = 4.50)
EPS_SHARE <- 1e-6
CRISIS_LABEL <- "CRISIS"

JSON_OUTPUT_DIR <- "./JSON"
MASTER_JSON_FILE <- file.path(JSON_OUTPUT_DIR, "soft_live_prices.json")
dir.create(JSON_OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

# ==========================================================
# TIMERS
# ==========================================================

get_next_trigger_time_engine <- function(now = Sys.time()) {
  tz <- attr(now, "tzone")
  if (is.null(tz)) tz <- ""
  base <- as.POSIXct(strftime(now, "%Y-%m-%d %H:00:00", tz = tz), tz = tz)
  mins <- c(14, 29, 44, 59)
  cand <- base + mins * 60 + 30
  nxt <- cand[cand > now]
  if (length(nxt) == 0) base + 3600 + 14 * 60 + 30 else min(nxt)
}

get_next_trigger_time_UI <- function(now = Sys.time()) {
  tz <- attr(now, "tzone")
  if (is.null(tz)) tz <- ""
  base <- as.POSIXct(strftime(now, "%Y-%m-%d %H:00:00", tz = tz), tz = tz)
  mins <- c(14, 29, 44, 59)
  cand <- base + mins * 60 + 30
  cand[cand < now] <- cand[cand < now] + 3600
  min(cand)
}

# ==========================================================
# UI
# ==========================================================

ui <- fluidPage(
  useShinyjs(),
  tags$head(
    tags$style(HTML("
      body {background:#111; color:#eee; font-family:'Segoe UI';}
    ")),
    tags$script(HTML("
      function flashScreen() {
        var body = document.body;
        var old = window.getComputedStyle(body).backgroundColor;
        body.style.transition='background-color 0.5s';
        body.style.backgroundColor='red';
        setTimeout(()=>body.style.backgroundColor=old,5000);
      }
      function playCrisisSound() {
        var a = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
        a.play();
      }
    "))
  ),
  h1("Investo Society — Soft Market Live Monitoring", style = "text-align:center; color:#00ff88;"),
  h3("🍺📈 Dynamic Volume Sensitivity Model — SQL Edition", style = "text-align:center;"),
  div(
    style = "text-align:center;",
    actionButton(
      "triggerCrisis",
      "Trigger Crisis Next Interval",
      style = "background:red; color:black; font-size:20px; font-weight:bold;"
    )
  ),
  div(id = "crisisScheduled", "⚠ Crisis scheduled!", style = "display:none; color:red; text-align:center; font-size:20px;"),
  htmlOutput("countdown"),
  div(id = "crisisActivated", "🚨 CRISIS ACTIVATED!", style = "display:none; text-align:center; font-size:24px; background:red;"),
  uiOutput("styledPriceTable"),
  plotOutput("pricePlot", height = 520),
  h3("Per-interval details (Price & Quantity by Soft Drink)"),
  DTOutput("periodMatrix")
)

# ==========================================================
# SERVER
# ==========================================================

server <- function(input, output, session) {
  # =====================================
  # MODEL CONFIG
  # =====================================

  START_TIME <- as.POSIXct("2025-01-01 18:00:00")
  INTERVAL_LENGTH <- 15 * 60

  ALPHA_SHARE <- 0.1
  ABS_IMPACT_WEIGHT <- 0.9
  LAMBDA <- 0.05
  LAMBDA_SHARE <- 0.05

  DEPTH <- 5
  MAX_CHANGE <- 0.40
  ROUND_TO <- 0.5
  SOFT_FLOOR_DELTA <- 2

  WARMUP_PERIOD <- 1
  LAMBDA_RAMP <- 1

  CRISIS_TIMES <- c(0L, 0L, 0L)

  SPIKE_MULTIPLIER <- 2
  SPIKE_DROP_PCT <- 0.3

  # =====================================
  # STATE
  # =====================================

  EVENT_COUNTER <- reactiveVal(0)
  crisis_triggered <- reactiveVal(FALSE)
  last_row <- reactiveVal(0)

  ema_volumes <- reactiveVal(NULL)
  ema_shares <- reactiveVal(NULL)
  warmup_count <- reactiveVal(0)

  cum_profit <- reactiveVal(0)
  cum_sold <- reactiveVal(setNames(rep(0, 3), names(BASE_PRICES)))

  current_prices <- BASE_PRICES

  price_history <- reactiveVal(
    data.frame(
      Index = 0,
      Interval = "T0",
      Event = "T0",
      Vin_Spumant_Fara_Alcool = 12,
      Apa = 8,
      Cola = 9,
      Profit = 0,
      CumProfit = 0
    )
  )

  txn_history <- reactiveVal(
    data.frame(
      Index = 0,
      Interval = "T0",
      Event = "T0",
      Drink = names(BASE_PRICES),
      Quantity = 0,
      Price = BASE_PRICES
    )
  )

  scheduler_initialized <- reactiveVal(FALSE)
  backfill_done <- reactiveVal(FALSE)

  safe_rbind <- function(a, b) {
    common <- union(names(a), names(b))
    for (nm in setdiff(common, names(a))) a[[nm]] <- NA
    for (nm in setdiff(common, names(b))) b[[nm]] <- NA
    rbind(a[, common], b[, common])
  }

  # =====================================
  # JSON writer (ADAPTED TO MATCH REQUESTED FORMAT)
  # =====================================

  write_master_json <- function(index, interval, event_label, price_vec, profit_tick = NA, cumP = NA, is_T0 = FALSE) {
    if (file.exists(MASTER_JSON_FILE)) {
      js <- tryCatch(fromJSON(MASTER_JSON_FILE, simplifyVector = FALSE), error = function(e) list())
      if (!is.list(js)) js <- list()
    } else {
      js <- list()
    }

    if (is_T0) {
      row_obj <- list(
        Interval = interval,
        Vin_Spumant_Fara_Alcool = as.numeric(price_vec[["Vin_Spumant_Fara_Alcool"]]),
        Apa = as.numeric(price_vec[["Apa"]]),
        Cola = as.numeric(price_vec[["Cola"]])
      )
    } else {
      row_obj <- list(
        Index = as.integer(index),
        Interval = as.character(interval),
        Event = as.character(event_label),
        Vin_Spumant_Fara_Alcool = as.numeric(price_vec[["Vin_Spumant_Fara_Alcool"]]),
        Apa = as.numeric(price_vec[["Apa"]]),
        Cola = as.numeric(price_vec[["Cola"]]),
        Profit = as.numeric(profit_tick),
        CumProfit = as.numeric(cumP)
      )
    }

    js <- append(js, list(row_obj))
    write_json(js, MASTER_JSON_FILE, pretty = TRUE, auto_unbox = TRUE)
  }

  # ==========================================================
  # CRISIS BUTTON
  # ==========================================================

  observeEvent(input$triggerCrisis, {
    crisis_triggered(TRUE)
    show("crisisScheduled")
  })

  # ==========================================================
  # COUNTDOWN
  # ==========================================================

  countdownTimer <- reactiveTimer(1000)

  observe({
    countdownTimer()
    now <- Sys.time()
    next_t <- get_next_trigger_time_UI(now)
    secs <- as.integer(difftime(next_t, now, units = "secs"))
    secs <- max(0, secs)
    output$countdown <- renderUI(
      HTML(sprintf(
        "<div style='text-align:center;'>Next UI refresh in %02d:%02d</div>",
        secs %/% 60, secs %% 60
      ))
    )
  })

  # ==========================================================
  # CORE ENGINE
  # ==========================================================

  process_row <- function(row_index, v_vec, write_latest = TRUE) {
    interval_ts <- format(START_TIME + row_index * INTERVAL_LENGTH, "%H:%M")

    # ----------------------------------------------------------
    # CRISIS MODE
    # ----------------------------------------------------------

    if (crisis_triggered()) {
      runjs("flashScreen();")
      runjs("playCrisisSound();")
      show("crisisActivated")
      runjs("setTimeout(()=>$('#crisisActivated').hide(),5000);")

      crisis_index <- last_row() # DO NOT increment tick index

      # reset EMAs
      hist_tx <- txn_history()
      if (nrow(hist_tx) > 0) {
        avgd <- hist_tx %>%
          group_by(Drink) %>%
          summarise(avgQ = mean(Quantity))
        avg <- setNames(avgd$avgQ[match(names(BASE_PRICES), avgd$Drink)], names(BASE_PRICES))
        avg[is.na(avg)] <- 0
        ema_volumes(avg)
        tot <- sum(avg)
        ema_shares(if (tot > 0) avg / tot else rep(1 / 3, 3))
      }

      new_prices <- current_prices
      for (d in names(new_prices)) new_prices[[d]] <- min(new_prices[[d]], BASE_PRICES[[d]] - 1)

      EVENT_COUNTER(EVENT_COUNTER() + 1)

      price_history(
        safe_rbind(
          price_history(),
          data.frame(
            Index = crisis_index,
            Interval = "CRISIS",
            Event = "CRISIS_TRIGGERED",
            Vin_Spumant_Fara_Alcool = new_prices["Vin_Spumant_Fara_Alcool"],
            Apa = new_prices["Apa"],
            Cola = new_prices["Cola"],
            Profit = 0,
            CumProfit = cum_profit()
          )
        )
      )

      if (write_latest) {
        write_master_json(
          index = crisis_index,
          interval = "CRISIS",
          event_label = "CRISIS_TRIGGERED",
          price_vec = new_prices,
          profit_tick = 0,
          cumP = cum_profit(),
          is_T0 = FALSE
        )
      }

      crisis_triggered(FALSE)
      hide("crisisScheduled")
      return(invisible(NULL))
    }

    # ----------------------------------------------------------
    # NORMAL ENGINE
    # ----------------------------------------------------------

    if (sum(v_vec) == 0) {
      last_row(row_index)
      return()
    }

    is_warmup <- warmup_count() < WARMUP_PERIOD

    if (is_warmup) {
      ema_volumes(if (is.null(ema_volumes())) v_vec else (1 - LAMBDA) * ema_volumes() + LAMBDA * v_vec)
      tot <- sum(v_vec)
      if (tot > 0) {
        sh <- v_vec / tot
        ema_shares(if (is.null(ema_shares())) sh else (1 - LAMBDA_SHARE) * ema_shares() + LAMBDA_SHARE * sh)
      }
      warmup_count(warmup_count() + 1)
    }

    avg_qty <- mean(v_vec[v_vec > 0])
    if (!is.finite(avg_qty) || avg_qty <= 0) avg_qty <- 1

    DEPTH_dyn <- DEPTH * avg_qty
    ABSW_dyn <- ABS_IMPACT_WEIGHT * (1 / log(avg_qty + 1))

    lambda_t <- if (row_index <= WARMUP_PERIOD) 0 else min(1, (row_index - WARMUP_PERIOD) / LAMBDA_RAMP) * LAMBDA
    lambda_sh <- if (row_index <= WARMUP_PERIOD) 0 else min(1, (row_index - WARMUP_PERIOD) / LAMBDA_RAMP) * LAMBDA_SHARE

    ema_new <- (1 - lambda_t) * ema_volumes() + lambda_t * v_vec
    cur_sh <- if (sum(v_vec) > 0) v_vec / sum(v_vec) else ema_shares()
    sh_new <- (1 - lambda_sh) * ema_shares() + lambda_sh * cur_sh

    new_prices <- current_prices
    event_label <- if (is_warmup) "SMOOTHED" else ""

    for (drink in names(BASE_PRICES)) {
      p_t <- current_prices[[drink]]
      b0 <- BASE_PRICES[[drink]]

      s_now <- cur_sh[[drink]]
      s_exp <- sh_new[[drink]]
      denom <- (s_exp * (1 - s_exp)) + EPS_SHARE
      oi_share <- (s_now - s_exp) / denom

      e_vol <- ema_new[[drink]]
      x_vol <- v_vec[[drink]]
      oi_abs <- (x_vol - e_vol) / (e_vol + DEPTH_dyn)

      oi_share <- max(min(oi_share, 1), -1)
      oi_abs <- max(min(oi_abs, 1), -1)

      oi_raw <- ALPHA_SHARE * oi_share + ABSW_dyn * oi_abs
      if (is_warmup) oi_raw <- oi_raw * ((5 + row_index) / 10)

      p_new <- p_t * (1 + oi_raw)
      ratio <- p_new / p_t
      if (ratio > 1 + MAX_CHANGE) p_new <- p_t * (1 + MAX_CHANGE)
      if (ratio < 1 - MAX_CHANGE) p_new <- p_t * (1 - MAX_CHANGE)

      p_new <- round(p_new / ROUND_TO) * ROUND_TO
      p_new <- max(p_new, b0 - SOFT_FLOOR_DELTA)

      if (p_new > SPIKE_MULTIPLIER * b0) {
        p_new <- round((p_new * (1 - SPIKE_DROP_PCT)) / ROUND_TO) * ROUND_TO
        event_label <- paste(event_label, "SPIKE_CORRECTED")
      }

      new_prices[[drink]] <- p_new
    }

    if (row_index %in% CRISIS_TIMES) {
      new_prices <- BASE_PRICES
      event_label <- CRISIS_LABEL
    }

    profit_tick <- sum(v_vec * (unlist(new_prices) - BOTTLE_COST))
    cumP <- cum_profit() + profit_tick

    current_prices <<- new_prices
    ema_volumes(ema_new)
    ema_shares(sh_new)

    cum_sold(cum_sold() + v_vec)
    cum_profit(cumP)

    last_row(row_index)

    price_history(
      safe_rbind(
        price_history(),
        data.frame(
          Index = row_index,
          Interval = interval_ts,
          Event = event_label,
          Vin_Spumant_Fara_Alcool = new_prices["Vin_Spumant_Fara_Alcool"],
          Apa = new_prices["Apa"],
          Cola = new_prices["Cola"],
          Profit = round(profit_tick, 2),
          CumProfit = round(cumP, 2)
        )
      )
    )

    txn_history(
      rbind(
        txn_history(),
        data.frame(
          Index = rep(row_index, length(new_prices)),
          Interval = rep(interval_ts, length(new_prices)),
          Event = rep(event_label, length(new_prices)),
          Drink = names(new_prices),
          Quantity = as.numeric(v_vec[names(new_prices)]),
          Price = as.numeric(new_prices),
          stringsAsFactors = FALSE
        )
      )
    )

    if (write_latest) {
      EVENT_COUNTER(EVENT_COUNTER() + 1)
      write_master_json(
        index = row_index,
        interval = interval_ts,
        event_label = event_label,
        price_vec = new_prices,
        profit_tick = round(profit_tick, 2),
        cumP = round(cumP, 2),
        is_T0 = FALSE
      )
    }
  }

  # ==========================================================
  # BACKFILL FROM SQL AT STARTUP
  # ==========================================================

  observe({
    if (backfill_done()) {
      return()
    }

    if (file.exists(MASTER_JSON_FILE)) file.remove(MASTER_JSON_FILE)
    EVENT_COUNTER(0)

    # WRITE INITIAL T0 ROW IN REQUESTED JSON FORMAT
    write_master_json(
      index = 0,
      interval = "T0",
      event_label = "T0",
      price_vec = BASE_PRICES,
      profit_tick = NA,
      cumP = NA,
      is_T0 = TRUE
    )

    df <- tryCatch(
      dbGetQuery(
        pool,
        "SELECT Vin_Spumant_Fara_Alcool, Apa, Cola FROM racoritoare"
      ),
      error = function(e) NULL
    )
    if (is.null(df)) {
      backfill_done(TRUE)
      return()
    }

    df <- df[rowSums(df) > 0, , drop = FALSE]
    if (nrow(df) == 0) {
      backfill_done(TRUE)
      return()
    }

    for (i in seq_len(nrow(df))) {
      v_vec <- df[i, ]
      process_row(i, v_vec, write_latest = TRUE)
    }

    backfill_done(TRUE)
  })

  # ==========================================================
  # LIVE ENGINE LOOP — SQL POLLING
  # ==========================================================

  observe({
    if (!backfill_done()) {
      invalidateLater(1000)
      return()
    }

    now <- Sys.time()
    next_t <- get_next_trigger_time_engine(now)
    delay_ms <- max(1000L, as.integer(difftime(next_t, now, units = "secs") * 1000))
    invalidateLater(delay_ms)

    if (!scheduler_initialized()) {
      scheduler_initialized(TRUE)
      return()
    }

    df <- tryCatch(dbGetQuery(pool, "SELECT Vin_Spumant_Fara_Alcool, Apa, Cola FROM racoritoare"), error = function(e) NULL)
    if (is.null(df)) {
      return()
    }

    df <- df[rowSums(df) > 0, , drop = FALSE]
    if (nrow(df) == 0) {
      return()
    }

    row_index <- last_row() + 1

    if (row_index > nrow(df)) {
      if (crisis_triggered()) {
        v_vec <- setNames(rep(0, 3), names(BASE_PRICES))
        process_row(row_index, v_vec)
      }
      return()
    }

    v_vec <- df[row_index, ]
    process_row(row_index, v_vec)
  })

  # ==========================================================
  # OUTPUTS
  # ==========================================================

  output$styledPriceTable <- renderUI({
    h <- price_history()
    latest <- tail(h, 1)

    tbl <- data.frame(
      Drink = names(BASE_PRICES),
      Price = unlist(latest[1, names(BASE_PRICES)]),
      Delta = unlist(latest[1, names(BASE_PRICES)]) - BASE_PRICES
    )

    crisis_badge <- if (nzchar(latest$Event[1])) {
      tags$span(style = "color:red; font-weight:bold;", paste("🚨", latest$Event[1]))
    }

    tags$table(
      style = "margin:auto; width:60%;",
      tags$thead(tags$tr(tags$th("Drink"), tags$th("Price"), tags$th("Δ"))),
      tags$tbody(
        lapply(1:nrow(tbl), function(i) {
          tags$tr(
            tags$td(tbl$Drink[i]),
            tags$td(sprintf("%.2f", tbl$Price[i])),
            tags$td(sprintf("%+.2f", tbl$Delta[i]))
          )
        }),
        tags$tr(tags$td("Interval"), tags$td(colspan = 2, latest$Interval)),
        tags$tr(tags$td("Profit"), tags$td(colspan = 2, latest$Profit)),
        tags$tr(tags$td("Total"), tags$td(colspan = 2, latest$CumProfit)),
        tags$tr(tags$td(colspan = 3, crisis_badge))
      )
    )
  })

  output$pricePlot <- renderPlot({
    h <- price_history()
    if (nrow(h) < 2) {
      return(NULL)
    }
    h$Interval <- factor(h$Interval, levels = unique(h$Interval))
    hl <- h %>% pivot_longer(cols = names(BASE_PRICES), names_to = "Drink", values_to = "Price")
    ggplot(hl, aes(Interval, Price, color = Drink)) +
      geom_line(size = 1.2) +
      geom_point(size = 2) +
      theme_minimal(base_size = 15)
  })

  output$periodMatrix <- renderDT({
    df <- txn_history()
    if (nrow(df) == 0) {
      return(NULL)
    }
    df2 <- df %>%
      group_by(Index, Interval, Event, Drink) %>%
      summarise(Price = mean(Price), Quantity = sum(Quantity), .groups = "drop")
    wide <- pivot_wider(
      df2,
      id_cols = c(Index, Interval, Event),
      names_from = Drink,
      values_from = c(Price, Quantity),
      names_glue = "{Drink}_{.value}"
    )
    datatable(wide, options = list(scrollX = TRUE))
  })

  onStop(function() poolClose(pool))
}

# ==========================================================
# RUN APP
# ==========================================================

runApp(shinyApp(ui, server))
