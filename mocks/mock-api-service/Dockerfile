# Multi-stage Dockerfile for Mock API Service

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY MockApiService.csproj .
RUN dotnet restore MockApiService.csproj

# Copy source code and build the application
COPY . .
RUN dotnet build MockApiService.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish MockApiService.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Copy published application from build stage
COPY --from=publish /app/publish .

# Configure environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:3001
ENV ASPNETCORE_HTTP_PORTS=3001

# Expose the port
EXPOSE 3001

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Set the entry point
ENTRYPOINT ["dotnet", "MockApiService.dll"]