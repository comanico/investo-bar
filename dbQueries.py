import mysql.connector  
from urllib.parse import urlparse

class dbQueries():
    def __init__(self):
        self.DATABASE_URL = ""
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
            for query in [
                "TRUNCATE TABLE sales",
                "TRUNCATE TABLE bere",
                "TRUNCATE TABLE vin",
                "TRUNCATE TABLE racoritoare"
                ]:
                connection = mysql.connector.connect(**self.config)
                if connection.is_connected():
                    print("Successfully connected to the database!")
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


    def insertLine(self):
        try:
            for query in [
                "INSERT INTO bere (Heineken, Corona, Peroni) VALUES (0,0,0);",
                "INSERT INTO vin (Aperol, Vin_Rosu, Vin_Alb, Prosecco) VALUES (0,0,0,0);",
                "INSERT INTO racoritoare (Apa, Cola) VALUES (0,0);"
                ]:
                connection = mysql.connector.connect(**self.config)
                if connection.is_connected():
                    print("Successfully connected to the database!")
                    cursor = connection.cursor()
                    cursor.execute(query)
                    connection.commit()
                    print(f"Succesfully created new line in table {query.split()[2]}")
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
    dbQueries.insertLine()