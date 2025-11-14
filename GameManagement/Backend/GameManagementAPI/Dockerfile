FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["GameManagementAPI.csproj", "."]
RUN dotnet restore "GameManagementAPI.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "GameManagementAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "GameManagementAPI.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GameManagementAPI.dll"]