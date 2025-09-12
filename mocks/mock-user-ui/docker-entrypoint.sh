#!/bin/sh

# Docker entrypoint script for User Management UI
# Handles runtime environment variable substitution

set -e

# Function to substitute environment variables in JavaScript files
substitute_env_vars() {
    echo "Substituting environment variables in built files..."
    
    # Find all JavaScript files in the dist directory
    find /usr/share/nginx/html -name "*.js" -type f | while read -r file; do
        echo "Processing: $file"
        
        # Create a temporary file for substitution
        temp_file=$(mktemp)
        
        # Substitute environment variables
        envsubst '${VITE_API_BASE_URL} ${VITE_MAIN_APP_URL} ${VITE_APP_TITLE}' < "$file" > "$temp_file"
        
        # Replace original file with substituted content
        mv "$temp_file" "$file"
    done
    
    echo "Environment variable substitution completed."
}

# Function to create runtime config file
create_runtime_config() {
    echo "Creating runtime configuration..."
    
    cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
    VITE_API_BASE_URL: '${VITE_API_BASE_URL}',
    VITE_MAIN_APP_URL: '${VITE_MAIN_APP_URL}',
    VITE_APP_TITLE: '${VITE_APP_TITLE}'
};
EOF
    
    echo "Runtime configuration created."
}

# Print environment variables for debugging
echo "=== Environment Variables ==="
echo "VITE_API_BASE_URL: ${VITE_API_BASE_URL}"
echo "VITE_MAIN_APP_URL: ${VITE_MAIN_APP_URL}"
echo "VITE_APP_TITLE: ${VITE_APP_TITLE}"
echo "=============================="

# Create runtime configuration
create_runtime_config

# Substitute environment variables in built files (if needed)
# Note: This is a fallback approach. The preferred method is using the runtime config.
# substitute_env_vars

# Execute the main command
exec "$@"