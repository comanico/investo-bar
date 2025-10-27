import os
import mysql.connector  
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

class dbQueries():
    def __init__(self):
        self.DATABASE_URL = os.getenv('DATABASE_URL')
        self.parsed_url = urlparse(self.DATABASE_URL)
        self.config = {
            'user': self.parsed_url.username,
            'password': self.parsed_url.password,
            'host': self.parsed_url.hostname,
            'port': self.parsed_url.port,
            'database': self.parsed_url.path[1:]
        }

    def clearTables(self):
        try:
            connection = mysql.connector.connect(**self.config)
            if connection.is_connected():
                print("Successfully connected to the database!")
                for query in [
                    "TRUNCATE TABLE sales",
                    "TRUNCATE TABLE bere",
                    "TRUNCATE TABLE vin",
                    "TRUNCATE TABLE racoritoare"
                    ]:
                    cursor = connection.cursor()
                    cursor.execute(query)
                    connection.commit()
                    print(f"Succesfully truncated table {query.split()[-1]}")
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            if 'connection' in locals():
                connection.rollback()
        finally:
            if "connection" in locals() and connection.is_connected():
                cursor.close()
                connection.close() 
                print("Database connection closed!")
        return

    def initializeTable(self):
            try:
                connection = mysql.connector.connect(**self.config)
                if connection.is_connected():
                    print("Successfully connected to the database!")
                    for query in [
                        "INSERT INTO bere (Heineken, Corona, Peroni) VALUES (0,0,0);",
                        "INSERT INTO vin (Aperol_Spritz, Vin_Rosu, Vin_Alb, Prosecco) VALUES (0,0,0,0);",
                        "INSERT INTO racoritoare (Apa, Cola) VALUES (0,0);"
                        ]:
                        cursor = connection.cursor()
                        cursor.execute(query)
                        connection.commit()
                        print(f"Succesfully initialized table {query.split()[2]}")
            except mysql.connector.Error as err:
                print(f"Error: {err}")
                if 'connection' in locals():
                    connection.rollback()
            finally:
                if "connection" in locals() and connection.is_connected():
                    cursor.close()
                    connection.close() 
                    print("Database connection closed!")
            return

    def insertLine(self):
        try:
            connection = mysql.connector.connect(**self.config)
            if connection.is_connected():
                print("Successfully connected to the database!")
                cursor = connection.cursor()

                table_configs = [
                    {
                        'table': 'bere',
                        'columns': ['Heineken', 'Corona', 'Peroni'],
                        'insert_query': "INSERT INTO bere (Heineken, Corona, Peroni) VALUES (%s, %s, %s)",
                        'values': (0, 0, 0),
                        'empty': True
                    },
                    {
                        'table': 'vin',
                        'columns': ['Aperol_Spritz', 'Vin_Rosu', 'Vin_Alb', 'Prosecco'],
                        'insert_query': "INSERT INTO vin (Aperol_Spritz, Vin_Rosu, Vin_Alb, Prosecco) VALUES (%s, %s, %s, %s)",
                        'values': (0, 0, 0, 0),
                        'empty': True
                    },
                    {
                        'table': 'racoritoare',
                        'columns': ['Apa', 'Cola'],
                        'insert_query': "INSERT INTO racoritoare (Apa, Cola) VALUES (%s, %s)",
                        'values': (0, 0),
                        'empty': True
                    }
                ]
                for config in table_configs:
                    table = config["table"]
                    columns = config["columns"]

                    select_query = f"SELECT {', '.join(columns)} FROM {table} ORDER BY id DESC LIMIT 1"
                    cursor.execute(select_query)
                    last_row = cursor.fetchone()
                    config["empty"] = last_row is None or all(x == 0 or x is None for x in last_row)
                if all(x["empty"] == True for x in table_configs):
                    print(f"All tables have last line empty. Skipping insert.")
                else:
                    # Insert a new row with zeros
                    for config in table_configs:
                        cursor.execute(config["insert_query"], config["values"])
                        connection.commit()
                        print(f"Successfully inserted new row in {config["table"]} with {', '.join(config["columns"])} = 0.")
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            if 'connection' in locals():
                connection.rollback()
        finally:
            if "connection" in locals() and connection.is_connected():
                cursor.close()
                connection.close() 
                print("Database connection closed!")
        return

if __name__ == "__main__":
    dbQueries = dbQueries()
    dbQueries.clearTables()
    dbQueries.initializeTable()