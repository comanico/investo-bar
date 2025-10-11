# ================================
# ========== SETTINGS ============
# ================================

# ---- MySQL Connection Settings ----
DATABASE_URL <- "mysql://admin:kM1BvaEUIm9hYgUvhKFp@investobar.cwdec6gs2zqk.us-east-1.rds.amazonaws.com:3306/INVESTOBAR"

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

# --- Base prices ---
BASE_PRICES <- setNames(
  c(10, 12),
  c("Heineken", "Corona")
)

# --- Sectorization ---
SECTOR_OF <- c(
  Heineken = "Beer",
  Corona = "Beer"
)

# Per-sector params
SECTOR_PARAMS <- list(
  "Beer" = list(ALPHA_SHARE = 0.45, LAMBDA_SHARE = 0.70, DEPTH = 8, K = 6)
)

# --- Market dynamics (global) ---
ALPHA <- 0.22
BETA <- 0
SIGMA <- 0.035
LAMBDA <- 0.45

# --- Drift control ---
USE_SHARE_IMPACT <- TRUE
ALPHA_SHARE <- 0.5
LAMBDA_SHARE <- 0.60
ABS_IMPACT_WEIGHT <- 0.30
EPS_SHARE <- 1e-6

# --- Volume scaling ---
VOLUME_SCALING_ENABLED <- TRUE
SECTOR_K_DEFAULT <- 6

# --- Early-interval behavior ---
WARMUP_TICKS <- 1
WARMUP_ALPHA_FACTOR <- 0.90
EARLY_BOOST_TICKS <- 2
EARLY_BOOST_FACTOR <- 1.10

# Liquidity depth
DEPTH_EARLY <- 4
DEPTH <- 9
DEPTH_TRANSITION_TICKS <- 6

# --- Per-tick safety/UX ---
MAX_CHANGE <- 0.40
ROUND_TO <- 0.5
SOFT_FLOOR_DELTA <- 1.0

# --- Profit settings ---
PROFIT_ENABLED <- TRUE
PROFIT_COST_MODE <- "base_minus_offset"
PROFIT_OFFSET_PER_UNIT <- 2

# --- Scheduling / cadence ---
UPDATE_INTERVAL_SECONDS <- 60

# --- Interval naming ---
T0_LABEL <- "T0 (Base)"
INTERVAL_NAMES <- c()

# --- Crisis configuration ---
CRISIS_MODE <- "off"
CRISIS_ONCE <- TRUE
CRISIS_MANUAL_INDEX <- NA_integer_
CRISIS_LABEL <- "CRISIS"

# --- Crisis visualization ---
SHOW_CRISIS_LINE <- TRUE
CRISIS_LINE_COLOR <- "red"
CRISIS_LINE_TYPE <- "dashed"
CRISIS_LINE_WIDTH <- 1.0
CRISIS_POINT_SHAPE <- 17
CRISIS_POINT_SIZE <- 4
CRISIS_POINT_COLOR <- "red"

# --- Persist JSON history ---
WRITE_JSON <- TRUE
JSON_PATH <- "D:/Git/FratiaInvestitiei/investo-bar/live_prices.json"

# --- Visuals ---
SHOW_POINT_LABELS <- FALSE
set.seed(123)
DRINK_COLORS <- setNames(grDevices::colors()[sample(1:657, length(BASE_PRICES))], names(BASE_PRICES))

# --- Evolution even when zero sales ---
PROCESS_ZERO_SALES_TICKS <- TRUE

# ================================
# ====== END OF SETTINGS =========
# ================================

# ---- Install & Load Required Packages ----
required_packages <- c("shiny", "dplyr", "tidyr", "ggplot2", "jsonlite", "DT", "RMySQL", "pool")
if (SHOW_POINT_LABELS) required_packages <- c(required_packages, "ggrepel")
new_packages <- required_packages[!(required_packages %in% installed.packages()[, "Package"])]
if (length(new_packages)) install.packages(new_packages)
suppressPackageStartupMessages({
  lapply(required_packages, library, character.only = TRUE)
})

# ---- Internal constants ----
TARGET_COLS <- c("Index", "Interval", "Event", names(BASE_PRICES), "Profit", "CumProfit")

# ---- UI ----
ui <- fluidPage(
  tags$head(
    tags$style(HTML("
      body { background-color: #111; color: #f0f0f0; font-family: 'Segoe UI', sans-serif; padding: 20px; }
      #mainTitle { font-size: 40px; font-weight: bold; text-align: center; margin-top: 10px; margin-bottom: 5px; color: #00f5d4; }
      #subTitle { font-size: 20px; text-align: center; margin-bottom: 20px; color: #f0f0f0; }
      #countdownTimer { font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 30px; color: #fcbf49; }
      .pricing-table { margin: 0 auto; width: 90%; border-collapse: collapse; background-color: transparent; }
      .pricing-table th { font-size: 18px; padding: 10px; background-color: transparent; border-bottom: 1px solid #444; text-align: center; }
      .pricing-table td { padding: 10px; text-align: center; border-bottom: 1px solid #222; }
      .pricing-table td.highlight { font-weight: bold; color: #00f5d4; font-size: 18px; }
      .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:12px; margin-left:6px; }
      .badge-crisis { background:#3a0; color:#fff; }
      .badge-warn { background:#a33; color:#fff; }
      .profit-row { font-weight:bold; color:#fcbf49; }
    "))
  ),
  div(id = "mainTitle", "Investo Society"),
  div(id = "subTitle", "🍹📈 Preturi Live - Evoluție Dinamică a Băuturilor 🍾💸"),
  htmlOutput("countdown"),
  uiOutput("statusMsg"),
  fluidRow(column(12, uiOutput("styledPriceTable"))),
  fluidRow(column(12, plotOutput("pricePlot", height = "520px"))),
  br(),
  h3("Detaliu pe perioade (rând = interval | coloane = sortimente × [Price, Quantity])"),
  fluidRow(column(12, DT::dataTableOutput("periodMatrix"))),
  tags$script(HTML(paste0("
    let countdown = ", UPDATE_INTERVAL_SECONDS - 1, ";
    function updateCountdown() {
      if (countdown <= 0) countdown = ", UPDATE_INTERVAL_SECONDS - 1, ";
      const el = document.getElementById('countdownTimer');
      if (el) { el.innerText = '🔁 Următorul update în: ' + countdown + ' secunde'; }
      countdown--;
    }
    setInterval(updateCountdown, 1000);
  ")))
)

# ---- Server ----
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
  
  # ---------- Helpers ----------
  safe_rbind <- function(a, b, cols) {
    for (nm in setdiff(cols, names(a))) a[[nm]] <- NA
    for (nm in setdiff(cols, names(b))) b[[nm]] <- NA
    a <- a[, cols, drop = FALSE]
    b <- b[, cols, drop = FALSE]
    rbind(a, b)
  }
  get_interval_label <- function(i) {
    if (length(INTERVAL_NAMES) >= i) {
      lab <- INTERVAL_NAMES[[i]]
      lab <- if (is.null(lab)) "..." else lab
      if (!nzchar(trimws(lab))) "..." else lab
    } else {
      "..."
    }
  }
  depth_at_tick <- function(t) {
    if (DEPTH_TRANSITION_TICKS <= 0) return(DEPTH)
    if (t <= 1) return(DEPTH_EARLY)
    if (t >= DEPTH_TRANSITION_TICKS) return(DEPTH)
    DEPTH_EARLY + (DEPTH - DEPTH_EARLY) * (t - 1) / (DEPTH_TRANSITION_TICKS - 1)
  }
  cost_vector <- function(mode, base_vec, offset) {
    if (mode == "base_minus_offset") pmax(base_vec - offset, 0)
    else if (mode == "base_plus_offset") base_vec + offset
    else base_vec
  }
  
  # ---------- Reactive state ----------
  current_prices <- BASE_PRICES
  
  price_history <- reactiveVal({
    df <- data.frame(
      Index = 0L,
      Interval = T0_LABEL,
      Event = "T0",
      as.list(BASE_PRICES),
      Profit = 0,
      CumProfit = 0,
      check.names = FALSE, stringsAsFactors = FALSE
    )
    df[, TARGET_COLS, drop = FALSE]
  })
  
  txn_history <- reactiveVal({
    data.frame(
      Index = 0L,
      Interval = T0_LABEL,
      Event = "T0",
      Drink = names(BASE_PRICES),
      Quantity = 0,
      Price = as.numeric(BASE_PRICES),
      check.names = FALSE, stringsAsFactors = FALSE
    )
  })
  
  data_cache <- reactiveVal(NULL)
  last_row_id <- reactiveVal(NULL)
  load_error <- reactiveVal("")
  
  ema_volumes <- reactiveVal(setNames(rep(0, length(BASE_PRICES)), names(BASE_PRICES)))
  ema_shares <- reactiveVal(setNames(rep(1/length(BASE_PRICES), length(BASE_PRICES)), names(BASE_PRICES)))
  ema_sector_shares <- reactiveVal(list())
  cum_sold <- reactiveVal(setNames(rep(0, length(BASE_PRICES)), names(BASE_PRICES)))
  cum_profit <- reactiveVal(0)
  
  crisis_index <- reactiveVal(NA_integer_)
  crisis_fired <- reactiveVal(FALSE)
  
  last_row <- reactiveVal(0L)
  
  autoInvalidate <- reactiveTimer(UPDATE_INTERVAL_SECONDS * 1000)
  
  output$statusMsg <- renderUI({
    msg <- load_error()
    cidx <- crisis_index()
    crisis_txt <- NULL
    if (!is.na(cidx)) {
      crisis_txt <- if (isTRUE(crisis_fired()))
        paste0("Crisis occurred at index ", cidx, ".")
      else
        paste0("Crisis scheduled at index ", cidx, ".")
    }
    if (!nzchar(msg) && is.null(crisis_txt)) return(NULL)
    tags$div(
      style="display:flex; gap:8px; justify-content:center; margin-bottom:8px;",
      if (nzchar(msg)) tags$span(class="badge badge-warn", paste("DB Error:", msg)),
      if (!is.null(crisis_txt)) tags$span(class="badge badge-crisis", crisis_txt)
    )
  })
  
  output$countdown <- renderUI({ tags$div(id = "countdownTimer") })
  
  # ---- Main loop (tick) ----
  observe({
    autoInvalidate()
    
    # 1) Load the last row from bere table
    query <- "
      SELECT id, Heineken, Corona 
      FROM bere 
      ORDER BY id DESC 
      LIMIT 1
    "
    df <- tryCatch({
      DBI::dbGetQuery(pool, query)
    }, error = function(e) {
      load_error(paste("DB query failed:", e$message))
      return(NULL)
    })
    
    if (is.null(df) || nrow(df) == 0) {
      load_error("No data in bere table or query failed")
      return()
    }
    
    # Ensure columns for all BASE_PRICES
    needed_cols <- names(BASE_PRICES)
    for (col in needed_cols) {
      if (!col %in% names(df)) df[[col]] <- 0
    }
    df <- df[, c("id", needed_cols), drop = FALSE]
    colnames(df)[1] <- "Index"
    
    # Check if this is a new row
    current_id <- df$Index[1]
    if (!is.null(last_row_id()) && current_id <= last_row_id()) {
      return()
    }
    
    data_cache(df)
    last_row_id(current_id)
    load_error("")
    
    # Initialize EMAs only on first load
    if (is.null(ema_sector_shares()) || length(ema_sector_shares()) == 0) {
      ema_baseline <- sapply(df[, names(BASE_PRICES), drop = FALSE], function(col) {
        suppressWarnings(stats::median(suppressWarnings(as.numeric(col)), na.rm = TRUE))
      })
      ema_baseline[is.na(ema_baseline)] <- 0
      ema_volumes(setNames(as.numeric(ema_baseline), names(BASE_PRICES)))
      
      sh_base <- ema_baseline
      if (sum(sh_base) > 0) sh_base <- sh_base / sum(sh_base) else sh_base <- rep(1/length(BASE_PRICES), length(BASE_PRICES))
      names(sh_base) <- names(BASE_PRICES)
      ema_shares(sh_base)
      
      sector_list <- split(names(BASE_PRICES), SECTOR_OF[names(BASE_PRICES)])
      message("sector_list: ", paste(names(sector_list), collapse = ", "))
      init <- lapply(sector_list, function(drinks) {
        rep(1/max(length(drinks), 1), length(drinks)) |> setNames(drinks)
      })
      ema_sector_shares(init)
      
      mode_lc <- tolower(CRISIS_MODE)
      if (mode_lc == "off") {
        crisis_index(NA_integer_)
      } else if (mode_lc == "manual") {
        idx <- as.integer(CRISIS_MANUAL_INDEX)
        if (!is.na(idx) && idx >= 1L) crisis_index(idx)
      }
    }
    
    df <- data_cache()
    if (is.null(df)) return()
    
    row_index <- last_row() + 1L
    
    v_now <- df[1, , drop = FALSE]
    v_now[is.na(v_now)] <- 0
    v_vec <- as.numeric(v_now[1, names(BASE_PRICES)])
    names(v_vec) <- names(BASE_PRICES)
    message("v_vec: ", paste(names(v_vec), v_vec, collapse = ", "))
    
    # Optionally skip zero-sales ticks
    if (!PROCESS_ZERO_SALES_TICKS && sum(v_vec) == 0) {
      last_row(row_index)
      return()
    }
    
    # Update EMA (volumes) & cumulative sold
    ema_prev <- ema_volumes()
    ema_new <- (1 - LAMBDA) * ema_prev + LAMBDA * v_vec
    cum_prev <- cum_sold()
    cum_new <- cum_prev + v_vec
    
    # Global shares
    row_tot <- sum(v_vec)
    cur_sh <- if (row_tot > 0) v_vec / row_tot else ema_shares()
    sh_prev <- ema_shares()
    sh_new <- (1 - LAMBDA_SHARE) * sh_prev + LAMBDA_SHARE * cur_sh
    ema_shares(sh_new)
    
    # Sector shares & per-sector EMAs
    sector_list <- split(names(BASE_PRICES), SECTOR_OF[names(BASE_PRICES)])
    cur_sector_shares <- list()
    new_sector_EMAs <- ema_sector_shares()
    
    sector_totals <- sapply(sector_list, function(dks) sum(v_vec[dks], na.rm = TRUE))
    
    for (sec in names(sector_list)) {
      dks <- sector_list[[sec]]
      row_tot_sec <- sector_totals[[sec]]
      cur_sh_sec <- setNames(rep(0, length(dks)), dks)
      if (row_tot_sec > 0) {
        for (dk in dks) {
          cur_sh_sec[dk] <- v_vec[dk] / row_tot_sec
        }
      } else {
        cur_sh_sec <- new_sector_EMAs[[sec]] %||% setNames(rep(1/max(length(dks), 1), length(dks)), dks)
      }
      lam_sec <- if (!is.null(SECTOR_PARAMS[[sec]]$LAMBDA_SHARE)) SECTOR_PARAMS[[sec]]$LAMBDA_SHARE else LAMBDA_SHARE
      ema_prev_sec <- new_sector_EMAs[[sec]] %||% setNames(rep(1/max(length(dks), 1), length(dks)), dks)
      ema_new_sec <- (1 - lam_sec) * ema_prev_sec + lam_sec * cur_sh_sec
      new_sector_EMAs[[sec]] <- ema_new_sec
      cur_sector_shares[[sec]] <- cur_sh_sec
      message("Sector ", sec, ": cur_sh_sec = ", paste(names(cur_sh_sec), cur_sh_sec, collapse = ", "))
    }
    ema_sector_shares(new_sector_EMAs)
    message("new_sector_EMAs: ", paste(names(new_sector_EMAs), lapply(new_sector_EMAs, function(x) paste(names(x), x, collapse = ", ")), collapse = "; "))
    
    # Crisis decision
    crisis_now <- (!is.na(crisis_index())) &&
      (row_index == crisis_index()) &&
      (!CRISIS_ONCE || !isTRUE(crisis_fired()))
    
    # Labels
    interval_label <- get_interval_label(row_index)
    index_value <- row_index
    
    # Effective alphas
    alpha_abs_base <- ALPHA
    alpha_share_base <- ALPHA_SHARE
    if (row_index <= WARMUP_TICKS) {
      alpha_abs_base <- alpha_abs_base * WARMUP_ALPHA_FACTOR
      alpha_share_base <- alpha_share_base * WARMUP_ALPHA_FACTOR
    }
    if (EARLY_BOOST_TICKS > 0 && row_index <= EARLY_BOOST_TICKS) {
      alpha_abs_base <- alpha_abs_base * EARLY_BOOST_FACTOR
      alpha_share_base <- alpha_share_base * EARLY_BOOST_FACTOR
    }
    
    # Time-varying depth
    depth_t <- depth_at_tick(row_index)
    
    # Price update
    new_prices <- current_prices
    if (isTRUE(crisis_now)) {
      new_prices <- BASE_PRICES
      if (CRISIS_ONCE) crisis_fired(TRUE)
    } else {
      for (drink in names(BASE_PRICES)) {
        p_t <- as.numeric(current_prices[[drink]])
        b0 <- as.numeric(BASE_PRICES[[drink]])
        
        sec <- SECTOR_OF[[drink]]
        dks <- sector_list[[sec]]
        
        a_share <- if (!is.null(SECTOR_PARAMS[[sec]]$ALPHA_SHARE)) SECTOR_PARAMS[[sec]]$ALPHA_SHARE else alpha_share_base
        if (row_index <= WARMUP_TICKS) a_share <- a_share * WARMUP_ALPHA_FACTOR
        if (EARLY_BOOST_TICKS > 0 && row_index <= EARLY_BOOST_TICKS) a_share <- a_share * EARLY_BOOST_FACTOR
        
        depth_sec <- if (!is.null(SECTOR_PARAMS[[sec]]$DEPTH)) SECTOR_PARAMS[[sec]]$DEPTH else depth_t
        K_sec <- if (!is.null(SECTOR_PARAMS[[sec]]$K)) SECTOR_PARAMS[[sec]]$K else SECTOR_K_DEFAULT
        
        s_now <- cur_sector_shares[[sec]][[drink]] %||% 0
        s_exp <- new_sector_EMAs[[sec]][[drink]] %||% 0
        denom <- (s_exp * (1 - s_exp)) + EPS_SHARE
        oi_sec <- (s_now - s_exp) / denom
        
        vol_sec <- sector_totals[[sec]]
        vol_factor <- if (VOLUME_SCALING_ENABLED) vol_sec / (vol_sec + K_sec) else 1.0
        
        e_vol <- ema_new[[drink]]
        x_vol <- v_vec[[drink]]
        oi_abs <- (x_vol - e_vol) / (e_vol + depth_sec)
        
        oi <- if (USE_SHARE_IMPACT) {
          (a_share * oi_sec * vol_factor) + (ABS_IMPACT_WEIGHT * alpha_abs_base * oi_abs)
        } else {
          alpha_abs_base * oi_abs
        }
        
        lp_t <- log(p_t)
        shock <- rnorm(1, mean = 0, sd = SIGMA)
        lp_new <- lp_t + oi - BETA * (lp_t - log(b0)) + shock
        
        p_new <- exp(lp_new)
        
        ratio <- p_new / p_t
        if (!is.na(ratio) && ratio > 1 + MAX_CHANGE) p_new <- p_t * (1 + MAX_CHANGE)
        if (!is.na(ratio) && ratio < 1 - MAX_CHANGE) p_new <- p_t * (1 - MAX_CHANGE)
        p_new <- round(p_new / ROUND_TO) * ROUND_TO
        p_new <- max(p_new, b0 - SOFT_FLOOR_DELTA)
        
        new_prices[[drink]] <- p_new
      }
    }
    
    # Profit for this interval
    profit_tick <- 0
    if (isTRUE(PROFIT_ENABLED)) {
      cost_per_unit <- cost_vector(PROFIT_COST_MODE, as.numeric(BASE_PRICES), PROFIT_OFFSET_PER_UNIT)
      names(cost_per_unit) <- names(BASE_PRICES)
      diffs <- unlist(new_prices) - cost_per_unit
      profit_tick <- sum(v_vec * diffs, na.rm = TRUE)
    }
    cum_profit_new <- cum_profit() + profit_tick
    
    # Commit state
    current_prices <<- new_prices
    ema_volumes(ema_new)
    cum_sold(cum_new)
    cum_profit(cum_profit_new)
    last_row(row_index)
    
    # Append to price history
    event_label <- if (isTRUE(crisis_now)) CRISIS_LABEL else ""
    hist <- price_history()
    new_row <- data.frame(
      Index = index_value,
      Interval = interval_label,
      Event = event_label,
      as.list(new_prices),
      Profit = round(profit_tick, 2),
      CumProfit = round(cum_profit_new, 2),
      check.names = FALSE, stringsAsFactors = FALSE
    )
    new_row <- new_row[, TARGET_COLS, drop = FALSE]
    hist <- safe_rbind(hist, new_row, TARGET_COLS)
    price_history(hist)
    
    # Append to period detail
    detail <- txn_history()
    per_drink <- data.frame(
      Index = rep(index_value, length(new_prices)),
      Interval = rep(interval_label, length(new_prices)),
      Event = rep(event_label, length(new_prices)),
      Drink = names(new_prices),
      Quantity = as.numeric(v_vec[names(new_prices)]),
      Price = as.numeric(unlist(new_prices)),
      check.names = FALSE, stringsAsFactors = FALSE
    )
    detail <- rbind(detail, per_drink)
    txn_history(detail)
    
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
    
    # Persist to price_history table
    insert_query <- sprintf(
      "INSERT INTO price_history (interval_index, %s, profit, cum_profit, created_at) 
       VALUES (%d, %s, %.2f, %.2f, NOW())",
      paste(sprintf("`%s`", names(BASE_PRICES)), collapse = ", "),
      index_value,
      paste(sprintf("%.2f", unlist(new_prices)), collapse = ", "),
      profit_tick,
      cum_profit_new
    )
    
    tryCatch({
      DBI::dbExecute(pool, insert_query)
    }, error = function(e) {
      message("DB insert failed: ", e$message)
    })
  })
  
  # ---- Outputs ----
  output$styledPriceTable <- renderUI({
    hist <- price_history()
    if (nrow(hist) == 0) return(NULL)
    latest <- tail(hist, 1)
    latest_prices_vec <- as.numeric(t(latest[1, names(BASE_PRICES), drop = FALSE]))
    delta <- round(latest_prices_vec - as.numeric(BASE_PRICES), 2)
    
    current_event <- as.character(latest$Event[1])
    event_badge <- if (nzchar(current_event))
      tags$span(class = "badge badge-crisis", paste0(" ", current_event, " "))
    else NULL
    
    table_data <- data.frame(
      Bautura = names(BASE_PRICES),
      Pret = latest_prices_vec,
      Evolutia = delta,
      stringsAsFactors = FALSE
    )
    
    prof_tick <- ifelse(is.na(latest$Profit[1]), 0, as.numeric(latest$Profit[1]))
    prof_cum <- ifelse(is.na(latest$CumProfit[1]), 0, as.numeric(latest$CumProfit[1]))
    
    tags$div(
      tags$div(style="text-align:center; margin-bottom:8px;",
               "Interval: ", latest$Interval, " (Index ", latest$Index, ") ", event_badge),
      tags$table(class = "pricing-table",
                 tags$thead(
                   tags$tr(
                     tags$th("Băutură"),
                     tags$th("Preț"),
                     tags$th("Evoluția față de T0")
                   )
                 ),
                 tags$tbody(
                   c(
                     lapply(1:nrow(table_data), function(i) {
                       tags$tr(
                         tags$td(table_data$Bautura[i]),
                         tags$td(class = "highlight", sprintf("%.2f", table_data$Pret[i])),
                         tags$td(sprintf("%+.2f", table_data$Evolutia[i]))
                       )
                     }),
                     list(
                       tags$tr(class="profit-row",
                               tags$td("Profit interval"),
                               tags$td(colspan = 2, sprintf("%.2f", prof_tick))
                       ),
                       tags$tr(class="profit-row",
                               tags$td("Profit cumulat"),
                               tags$td(colspan = 2, sprintf("%.2f", prof_cum))
                       )
                     )
                   )
                 )
      )
    )
  })
  
  output$pricePlot <- renderPlot({
    hist <- price_history()
    if (nrow(hist) < 2) return(NULL)
    
    drink_cols <- names(BASE_PRICES)
    hist_long <- hist %>%
      tidyr::pivot_longer(cols = dplyr::all_of(drink_cols), names_to = "Băutură", values_to = "Preț")
    
    p <- ggplot2::ggplot(hist_long, aes(x = Index, y = Preț, color = Băutură, group = Băutură)) +
      ggplot2::geom_line(linewidth = 1.2) +
      ggplot2::geom_point(size = 2) +
      ggplot2::theme_minimal(base_size = 15) +
      ggplot2::labs(
        title = "📉 Evoluția prețurilor în timp (T0 = prețuri de bază)",
        x = "Interval (Index; 0 = T0)",
        y = "Preț (lei)",
        color = "Băutură"
      ) +
      ggplot2::theme(
        plot.background = ggplot2::element_rect(fill = "#111", color = NA),
        panel.background = ggplot2::element_rect(fill = "#111", color = NA),
        panel.grid.major = ggplot2::element_line(color = "#333"),
        axis.text = ggplot2::element_text(color = "#ccc"),
        axis.title = ggplot2::element_text(color = "#eee"),
        legend.background = ggplot2::element_rect(fill = "#111"),
        legend.title = ggplot2::element_text(color = "#eee"),
        legend.text = ggplot2::element_text(color = "#ccc"),
        plot.title = ggplot2::element_text(size = 18, face = "bold", color = "#fff", hjust = 0.5)
      ) +
      ggplot2::scale_color_manual(values = DRINK_COLORS)
    
    cidx <- crisis_index()
    if (SHOW_CRISIS_LINE && !is.na(cidx) && any(hist$Index == cidx)) {
      p <- p + ggplot2::geom_vline(
        xintercept = cidx,
        linetype = CRISIS_LINE_TYPE,
        linewidth = CRISIS_LINE_WIDTH,
        color = CRISIS_LINE_COLOR
      )
      crisis_points <- subset(hist_long, Index == cidx)
      if (nrow(crisis_points) > 0) {
        p <- p + ggplot2::geom_point(
          data = crisis_points,
          aes(x = Index, y = Preț),
          shape = CRISIS_POINT_SHAPE,
          size = CRISIS_POINT_SIZE,
          color = CRISIS_POINT_COLOR
        )
      }
      p <- p + ggplot2::annotate(
        "text",
        x = cidx,
        y = max(hist_long$Preț, na.rm = TRUE),
        label = CRISIS_LABEL,
        vjust = -0.5,
        size = 4,
        color = CRISIS_LINE_COLOR
      )
    }
    
    if (SHOW_POINT_LABELS) {
      p <- p + ggrepel::geom_text_repel(
        aes(label = ifelse(Index == 0, "T0", "")),
        size = 3,
        max.overlaps = 10
      )
    }
    
    p
  })
  
  output$periodMatrix <- DT::renderDataTable({
    df_long <- txn_history()
    wide <- tidyr::pivot_wider(
      df_long,
      id_cols = c(Index, Interval, Event),
      names_from = Drink,
      values_from = c(Price, Quantity),
      names_glue = "{Drink} {.value}"
    )
    drink_pairs <- unlist(lapply(names(BASE_PRICES), function(d) c(sprintf("%s Price", d), sprintf("%s Quantity", d))))
    keep_cols <- c("Index", "Interval", "Event", intersect(drink_pairs, colnames(wide)))
    wide <- wide[, keep_cols, drop = FALSE]
    
    DT::datatable(
      wide,
      rownames = FALSE,
      options = list(
        pageLength = 10,
        lengthMenu = c(10, 20, 50, 100),
        scrollX = TRUE
      )
    )
  })
}

# ---- Run App ----
runApp(shinyApp(ui, server))