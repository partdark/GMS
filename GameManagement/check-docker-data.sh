# Проверить существующие volumes
docker volume ls

# Проверить содержимое volume
docker volume inspect project_postgres_data

# Подключиться к PostgreSQL контейнеру
docker exec -it project-postgres-1 psql -U postgres -d gamemanagement

# Или если имя контейнера другое:
docker ps
docker exec -it <postgres_container_name> psql -U postgres -d gamemanagement

# В PostgreSQL выполнить:
# SELECT COUNT(*) FROM "People";
# SELECT COUNT(*) FROM "Seasons";
# SELECT COUNT(*) FROM "Events";

# Если данных нет, проверить другие базы:
# \l
# \c <database_name>