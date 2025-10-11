import mysql.connector  
from urllib.parse import urlparse

DATABASE_URL = "mysql://admin:kM1BvaEUIm9hYgUvhKFp@investobar.cwdec6gs2zqk.us-east-1.rds.amazonaws.com:3306/INVESTOBAR"
parsed_url = urlparse(DATABASE_URL)

config = {
    'user': parsed_url.username,
    'password': parsed_url.password,
    'host': parsed_url.hostname,
    'port': parsed_url.port,
    'database': parsed_url.path[1:]
}

# # Helper function to check if current time is at a quarter-hour (first second)
# def is_quarter_hour():
#     now = datetime.now()
#     quarter_minutes = [0, 15, 30, 45]
#     return any((now.minute % 60) in {(q - 1) % 60, q, (q + 1) % 60} for q in quarter_minutes)

def main():
    try:
        for query in [
            "INSERT INTO bere (Heineken, Corona) VALUES (0,0);",
            "INSERT INTO vin (Aperol, Vin_Spumant, Vin_Alb, Prosecco) VALUES (0,0,0,0);",
            "INSERT INTO racoritoare (Apa_Minerala, Apa_Plata, Cola) VALUES (0,0,0);"
            ]:
            connection = mysql.connector.connect(**config)
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
            print("Databse connection closed!")
    return

if __name__ == "__main__":
    main()