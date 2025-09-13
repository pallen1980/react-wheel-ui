# User Management UI - Troubleshooting Guide

This guide helps resolve common issues when using the User Management UI for test user management.

## 🚨 Common Issues

### 1. UI Not Loading / Blank Page

**Symptoms:**
- Browser shows blank page at http://localhost:3002
- Loading spinner appears indefinitely
- Console shows network errors

**Causes & Solutions:**

#### Container Not Running
```bash
# Check if container is running
docker-compose ps

# If not running, start it
docker-compose up -d mock-user-ui

# Check logs for errors
docker-compose logs mock-user-ui
```

#### Port Conflicts
```bash
# Check if port 3002 is in use
netstat -an | findstr :3002  # Windows
lsof -i :3002                # macOS/Linux

# If port is occupied, stop the conflicting service or change port
```

#### Build Issues
```bash
# Rebuild the container
docker-compose build mock-user-ui
docker-compose up -d mock-user-ui
```

### 2. Cannot Connect to API Service

**Symptoms:**
- "Failed to load users" error message
- Network errors in browser console
- Users list shows loading state indefinitely

**Causes & Solutions:**

#### Mock API Service Not Running
```bash
# Check API service status
curl http://localhost:3001/health

# If not responding, start the service
docker-compose up -d mock-api

# Check API service logs
docker-compose logs mock-api
```

#### Incorrect API URL Configuration
```bash
# Check environment variables
docker-compose exec mock-user-ui env | grep VITE_API_BASE_URL

# Should show: VITE_API_BASE_URL=http://localhost:3001
# If incorrect, update docker-compose.yml and restart

# Note: The UI must use localhost:3001 (not internal Docker network URLs)
# because the React app runs in the browser, not inside the container
```

#### Network Connectivity Issues
```bash
# Test API connectivity from UI container
docker-compose exec mock-user-ui curl http://mock-api:3001/health

# Test from host machine
curl http://localhost:3001/api/users
```

### 3. CORS Errors

**Symptoms:**
- Browser console shows CORS policy errors
- API requests fail with CORS-related messages
- Network tab shows preflight request failures

**Solutions:**

#### Update Mock API CORS Configuration
```bash
# Check current CORS settings in mock API
docker-compose logs mock-api | grep CORS

# Ensure UI URL is included in CORS_ORIGINS
# Should include: http://localhost:3002
```

#### Verify Environment Variables
```yaml
# In docker-compose.yml, mock-api service should have:
environment:
  - CORS_ORIGINS=http://localhost:51235,http://localhost:3000,http://localhost:3002
```

### 4. Authentication Issues (401 Unauthorized)

**Symptoms:**
- "Failed to load users" with 401 Unauthorized errors
- API requests return authentication errors
- Console shows "No Bearer token found" messages

**Cause & Solution:**
The Mock API Service requires authentication for user management endpoints. This has been resolved by implementing automatic authentication in the User Management UI.

**How it works:**
- The UI automatically authenticates using a mock user account (`test@example.com`)
- Authentication tokens are automatically included in API requests
- If a token expires, the UI automatically re-authenticates

**If issues persist:**
```bash
# Check if authentication is working in API logs
docker-compose logs mock-api | grep "Successfully authenticated"

# Verify mock users are configured
docker-compose exec mock-api cat appsettings.json | grep -A 10 "MockUsers"
```

### 5. User Impersonation Fails

**Symptoms:**
- "Login as User" button doesn't redirect
- Redirect happens but user isn't logged in
- Error messages about authentication failure

**Causes & Solutions:**

#### Main Application Not Running
```bash
# Check if main app is accessible
curl http://localhost:51235

# Start main application if needed
npm run dev  # or docker-compose up -d
```

#### Incorrect Main App URL
```bash
# Check environment variable
docker-compose exec mock-user-ui env | grep VITE_MAIN_APP_URL

# Should show: VITE_MAIN_APP_URL=http://localhost:51235
# Update if incorrect
```

#### Authentication Token Issues
```bash
# Check API logs for token generation errors
docker-compose logs mock-api | grep impersonate

# Verify user exists in API
curl http://localhost:3001/api/users
```

### 5. Form Validation Issues

**Symptoms:**
- Form submissions fail with validation errors
- Password strength indicator not working
- Email validation not triggering

**Solutions:**

#### Clear Browser Cache
```bash
# Hard refresh the page
Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)

# Or clear browser cache completely
```

#### Check Form Data
- Ensure email format is valid (user@domain.com)
- Password must be at least 6 characters
- Display name must be 2-50 characters

#### JavaScript Errors
```bash
# Check browser console for JavaScript errors
# Look for React or form validation errors
```

### 6. Responsive Design Issues

**Symptoms:**
- UI doesn't work properly on mobile devices
- Layout breaks on small screens
- Touch targets too small

**Solutions:**

#### Browser Zoom
- Reset browser zoom to 100%
- Check if issue persists

#### Device Testing
```bash
# Test on different screen sizes
# Use browser dev tools device emulation
```

#### CSS Issues
```bash
# Check for CSS loading errors in network tab
# Verify SCSS compilation is working
```

## 🔍 Debugging Steps

### 1. Health Check Sequence

```bash
# 1. Check all services are running
docker-compose ps

# 2. Test service health endpoints
curl http://localhost:3002/health  # UI health
curl http://localhost:3001/health  # API health

# 3. Check service logs
docker-compose logs mock-user-ui
docker-compose logs mock-api

# 4. Test API endpoints directly
curl http://localhost:3001/api/users
```

### 2. Network Debugging

```bash
# Check container networking
docker network ls
docker network inspect the-wheel-ui_default

# Test inter-container communication
docker-compose exec mock-user-ui ping mock-api
docker-compose exec mock-user-ui curl http://mock-api:3001/health
```

### 3. Environment Debugging

```bash
# Check environment variables in containers
docker-compose exec mock-user-ui env
docker-compose exec mock-api env

# Verify configuration files
docker-compose config
```

### 4. Browser Debugging

1. **Open Browser Developer Tools** (F12)
2. **Check Console Tab** for JavaScript errors
3. **Check Network Tab** for failed requests
4. **Check Application Tab** for localStorage/sessionStorage issues

## 🛠️ Advanced Troubleshooting

### Container Issues

```bash
# Restart specific service
docker-compose restart mock-user-ui

# Rebuild and restart
docker-compose build mock-user-ui
docker-compose up -d mock-user-ui

# Remove and recreate container
docker-compose down mock-user-ui
docker-compose up -d mock-user-ui

# Full reset (removes all containers and volumes)
docker-compose down -v
docker-compose up -d
```

### Performance Issues

```bash
# Check container resource usage
docker stats

# Check system resources
# Ensure adequate RAM and CPU available

# Monitor network latency
ping localhost
```

### Data Issues

```bash
# Check if users are persisted
curl http://localhost:3001/api/users

# Reset user data (if needed)
docker-compose restart mock-api

# Check API service configuration
docker-compose exec mock-api cat appsettings.json
```

## 📋 Diagnostic Information

When reporting issues, please include:

### System Information
```bash
# Operating System
uname -a  # Linux/Mac
systeminfo  # Windows

# Docker version
docker --version
docker-compose --version

# Node.js version (if running locally)
node --version
npm --version
```

### Service Status
```bash
# Container status
docker-compose ps

# Service logs (last 50 lines)
docker-compose logs --tail=50 mock-user-ui
docker-compose logs --tail=50 mock-api

# Network configuration
docker-compose config
```

### Browser Information
- Browser name and version
- Console errors (copy full error messages)
- Network tab showing failed requests
- Any relevant screenshots

## 🆘 Getting Help

### Self-Service Resources
1. **Check this troubleshooting guide** for common solutions
2. **Review the main README** for setup instructions
3. **Check the test files** for usage examples
4. **Examine the Docker logs** for error details

### Escalation
If issues persist after following this guide:
1. Gather diagnostic information (see above)
2. Document exact steps to reproduce the issue
3. Note any error messages or unusual behavior
4. Create an issue in the project repository with all details

## 🔄 Quick Reset Procedure

If all else fails, try this complete reset:

```bash
# 1. Stop all services
docker-compose down

# 2. Remove containers and volumes
docker-compose down -v

# 3. Remove images (optional, forces rebuild)
docker-compose down --rmi all

# 4. Rebuild and start fresh
docker-compose build
docker-compose up -d

# 5. Wait for services to start (30-60 seconds)
sleep 60

# 6. Test access
curl http://localhost:3002/health
curl http://localhost:3001/health

# 7. Open in browser
# http://localhost:3002
```

This reset procedure resolves most configuration and state-related issues.