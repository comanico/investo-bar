# ---- Install & Load Required Packages ----
required_packages <- c("shiny", "googlesheets4", "dplyr", "tidyr", "ggplot2", "jsonlite")
new_packages <- required_packages[!(required_packages %in% installed.packages()[, "Package"])]
if (length(new_packages)) install.packages(new_packages)

# Load packages with suppressed startup messages to reduce warnings
suppressPackageStartupMessages({
  suppressWarnings({
    lapply(required_packages, library, character.only = TRUE)
  })
})

library(shiny)
library(googlesheets4)
library(dplyr)
library(tidyr)
library(ggplot2)
library(jsonlite)

# ---- Authenticate (if sheet is not public) ----
gs4_auth() # or use gs4_deauth() if the sheet is public

# ---- Sheet URL ----
sheet_url <- "https://docs.google.com/spreadsheets/d/1P2ITAsvY3pR8mJFJa36idzutiCrrk7XHHbZQrcxcfrg/edit?usp=sharing" # nolint: line_length_linter.


# Note: The 'validate' function masking warning is normal and harmless
# jsonlite's validate function masks shiny's validate, but this doesn't affect functionality # nolint: line_length_linter.
# Version warnings (4.4.3 vs 4.4.2) are also harmless - packages work across minor versions # nolint: line_length_linter.

# ---- Config ----
base_prices <- setNames(
  c(10, 12, 16, 10, 15, 15, 8, 8, 8),
  c(
    "Heineken", "Corona", "Aperol Spritz", "Vin Spumant 0%",
    "Vin Alb - Liliac Traminer", "Prosecco - Ponte Viloni",
    "Apa Plata", "Apa Minerala", "Cola"
  )
)

json_path <- "live_prices.json"
if (!file.exists(json_path)) {
  json_row <- data.frame(Interval = "T0", as.list(base_prices), stringsAsFactors = FALSE) # nolint: line_length_linter.
  json_row <- rbind(json_row)
  write_json(json_row, json_path, pretty = TRUE, auto_unbox = TRUE)
}

k <- 1
max_change <- 0.3

# Randomize colors for drinks (once per session)
set.seed(123) # Optional: for consistent randomization across runs
drink_colors <- setNames(grDevices::colors()[sample(1:657, length(base_prices))], names(base_prices)) # nolint: line_length_linter.

# ---- UI ----
ui <- fluidPage(
  tags$head(
    tags$style(HTML("
      body {
        background-color: #111;
        color: #f0f0f0;
        font-family: 'Segoe UI', sans-serif;
        padding: 20px;
      }
      #mainTitle {
        font-size: 40px;
        font-weight: bold;
        text-align: center;
        margin-top: 10px;
        margin-bottom: 5px;
        color: #00f5d4;
      }
      #subTitle {
        font-size: 20px;
        text-align: center;
        margin-bottom: 20px;
        color: #f0f0f0;
      }
      #countdownTimer {
        font-size: 28px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 30px;
        color: #fcbf49;
      }
      .pricing-table {
        margin: 0 auto;
        width: 80%;
        border-collapse: collapse;
        background-color: transparent;
      }
      .pricing-table th {
        font-size: 18px;
        padding: 10px;
        background-color: transparent;
        border-bottom: 1px solid #444;
        text-align: center;
      }
      .pricing-table td {
        padding: 12px;
        text-align: center;
        border-bottom: 1px solid #222;
      }
      .pricing-table td.highlight {
        font-weight: bold;
        color: #00f5d4;
        font-size: 20px;
      }
    "))
  ),
  div(id = "mainTitle", "Investo Society"),
  div(id = "subTitle", "🍹📈 Preturi Live - Evoluție Dinamică a Băuturilor 🍾💸"),
  htmlOutput("countdown"),
  fluidRow(
    column(
      12,
      uiOutput("styledPriceTable")
    )
  ),
  fluidRow(
    column(12, plotOutput("pricePlot", height = "500px"))
  ),
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
  "))
)

# ---- Server ----
server <- function(input, output, session) {
  current_prices <- base_prices
  price_history <- reactiveVal(data.frame(Interval = "Start", as.list(base_prices))) # nolint: line_length_linter.
  last_row <- reactiveVal(0)

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

  # Create reactive timer that updates at 15-minute intervals
  autoInvalidate <- reactiveTimer(getNext15MinuteInterval())

  observe({
    autoInvalidate()
    data <- read_sheet(sheet_url, skip = 3)
    if (!all(names(base_prices) %in% names(data))) {
      return()
    }

    row_index <- last_row() + 1
    if (row_index > nrow(data)) {
      return()
    }

    volumes <- data[row_index, names(base_prices), drop = FALSE]
    volumes[is.na(volumes)] <- 0
    total_sales <- sum(volumes)
    if (total_sales == 0) {
      return()
    }

    proportions <- volumes / total_sales
    mean_share <- 1 / length(base_prices)
    new_prices <- current_prices

    for (drink in names(base_prices)) {
      delta <- proportions[[drink]] - mean_share
      adjusted_price <- current_prices[[drink]] * (1 + k * delta)
      ratio <- adjusted_price / current_prices[[drink]]
      if (!is.na(ratio) && ratio > 1 + max_change) {
        adjusted_price <- current_prices[[drink]] * (1 + max_change)
      } else if (!is.na(ratio) && ratio < 1 - max_change) adjusted_price <- current_prices[[drink]] * (1 - max_change) # nolint: line_length_linter.

      adjusted_price <- round(adjusted_price * 2) / 2
      adjusted_price <- max(adjusted_price, base_prices[[drink]] - 1)
      new_prices[[drink]] <- adjusted_price
    }

    current_prices <<- new_prices
    hist <- price_history()
    interval_label <- paste0("T", row_index + 4)
    new_row <- data.frame(Interval = interval_label, as.list(new_prices))
    price_history(rbind(hist, new_row))
    last_row(row_index)

    json_path <- "live_prices.json"
    json_row <- data.frame(Interval = interval_label, as.list(new_prices), stringsAsFactors = FALSE) # nolint: line_length_linter.
    if (file.exists(json_path)) {
      json_data <- fromJSON(json_path, simplifyDataFrame = TRUE)
      json_row <- rbind(json_data, json_row)
    }
    write_json(json_row, json_path, pretty = TRUE, auto_unbox = TRUE)
  })

  output$countdown <- renderUI({
    tags$div(id = "countdownTimer")
  })

  output$styledPriceTable <- renderUI({
    latest <- tail(price_history(), 1)
    if (nrow(latest) == 0) {
      return(NULL)
    }

    delta <- round(latest[2:(length(base_prices) + 1)] - base_prices, 2)

    table_data <- data.frame(
      Bautura = names(base_prices),
      Pret = as.numeric(t(latest[2:(length(base_prices) + 1)])),
      Evolutia = as.numeric(t(delta)),
      stringsAsFactors = FALSE
    )

    table_html <- tags$table(
      class = "pricing-table",
      tags$thead(
        tags$tr(
          tags$th("Băutură"),
          tags$th("Preț"),
          tags$th("Evoluția Prețului")
        )
      ),
      tags$tbody(
        lapply(1:nrow(table_data), function(i) {
          tags$tr(
            tags$td(table_data$Bautura[i]),
            tags$td(class = "highlight", sprintf("%.2f", table_data$Pret[i])),
            tags$td(sprintf("%+.2f", table_data$Evolutia[i]))
          )
        })
      )
    )
    table_html
  })

  output$pricePlot <- renderPlot({
    hist <- price_history()
    if (nrow(hist) == 0) {
      return(NULL)
    }

    hist_long <- hist %>%
      pivot_longer(cols = -Interval, names_to = "Băutură", values_to = "Preț")

    ggplot(hist_long, aes(x = Interval, y = Preț, color = Băutură, group = Băutură)) + # nolint: line_length_linter.
      geom_line(linewidth = 1.2) +
      geom_point(size = 2) +
      theme_minimal(base_size = 15) +
      labs(
        title = "📉 Evoluția prețurilor în timp",
        x = "Interval",
        y = "Preț (lei)",
        color = "Băutură"
      ) +
      theme(
        plot.background = element_rect(fill = "#111", color = NA),
        panel.background = element_rect(fill = "#111", color = NA),
        panel.grid.major = element_line(color = "#333"),
        axis.text = element_text(color = "#ccc"),
        axis.title = element_text(color = "#eee"),
        legend.background = element_rect(fill = "#111"),
        legend.title = element_text(color = "#eee"),
        legend.text = element_text(color = "#ccc"),
        plot.title = element_text(size = 18, face = "bold", color = "#fff", hjust = 0.5),
        axis.text.x = element_text(angle = 45, hjust = 1)
      )
  })
}

# ---- Run App ----
runApp(shinyApp(ui, server))
