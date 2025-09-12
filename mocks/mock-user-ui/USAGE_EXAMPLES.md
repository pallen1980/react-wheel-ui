# User Management UI - Usage Examples

This guide provides step-by-step examples of common workflows in the User Management UI.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Test Users](#creating-test-users)
3. [Managing Existing Users](#managing-existing-users)
4. [User Impersonation](#user-impersonation)
5. [Search and Navigation](#search-and-navigation)
6. [Error Handling](#error-handling)
7. [Mobile Usage](#mobile-usage)
8. [Accessibility Features](#accessibility-features)

## 🚀 Getting Started

### Accessing the Interface

1. **Start the services** using Docker:
   ```bash
   docker-compose up -d
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3002
   ```

3. **You should see** the User Management interface with:
   - Header with "User Management" title
   - "Add New User" button in the top right
   - User list table (may be empty initially)
   - Search box above the table

### Initial Setup Verification

**Expected Interface Elements:**
- Clean, responsive layout
- Blue "Add New User" button
- Search input with placeholder text
- User count display (e.g., "0 of 0 users")
- Empty state message if no users exist

## 👤 Creating Test Users

### Example 1: Creating a Basic Test User

**Scenario:** Create a test user for QA testing

**Steps:**
1. **Click "Add New User"** button
   - Modal dialog opens with form
   - Focus automatically moves to email field

2. **Fill in user details:**
   ```
   Email: qa.tester@example.com
   Display Name: QA Tester
   Password: testpass123
   ```

3. **Observe form validation:**
   - Email validation occurs in real-time
   - Password strength indicator appears
   - All fields show green checkmarks when valid

4. **Click "Create User"**
   - Loading spinner appears on button
   - Success message displays
   - Modal closes automatically
   - New user appears in the list

**Expected Result:**
- User "qa.tester@example.com" appears in the table
- User count updates to "1 of 1 users"
- Green toast notification confirms creation

### Example 2: Creating User with Strong Password

**Scenario:** Create a user with a secure password

**Steps:**
1. **Open the create user form**
2. **Enter details with strong password:**
   ```
   Email: admin.user@example.com
   Display Name: Admin User
   Password: SecureP@ssw0rd!2024
   ```

3. **Watch password strength indicator:**
   - Bar fills up as password gets stronger
   - Color changes from red → yellow → green
   - Label shows "Weak" → "Medium" → "Strong"

4. **Complete creation**

**Expected Result:**
- Password strength shows "Strong" in green
- User created successfully
- Strong password accepted without issues

### Example 3: Handling Validation Errors

**Scenario:** Attempt to create user with invalid data

**Steps:**
1. **Open create user form**
2. **Enter invalid data:**
   ```
   Email: invalid-email
   Display Name: A  (too short)
   Password: 123   (too short)
   ```

3. **Observe validation feedback:**
   - Email field shows red border and error message
   - Display name shows "must be at least 2 characters"
   - Password shows "must be at least 6 characters"
   - Create button remains disabled

4. **Correct the errors:**
   ```
   Email: valid@example.com
   Display Name: Valid User
   Password: validpass
   ```

5. **Submit form**

**Expected Result:**
- Real-time validation prevents submission of invalid data
- Clear error messages guide user to fix issues
- Form only submits when all validation passes

## ✏️ Managing Existing Users

### Example 4: Editing User Information

**Scenario:** Update a user's display name and password

**Steps:**
1. **Locate user in the list**
   - Use search if needed: type "qa.tester"
   - Find "qa.tester@example.com" row

2. **Click "Edit" button** for that user
   - Edit modal opens
   - Form pre-populated with current data
   - Password field is empty (security)

3. **Update information:**
   ```
   Display Name: Senior QA Tester
   Password: newpassword123  (optional)
   ```

4. **Save changes**
   - Click "Update User"
   - Loading state appears
   - Success confirmation

**Expected Result:**
- User's display name updated in the table
- If password was changed, it's updated securely
- Success toast notification appears

### Example 5: Deleting a User

**Scenario:** Remove a test user that's no longer needed

**Steps:**
1. **Find the user** to delete
2. **Click "Delete" button** for that user
   - Confirmation dialog appears
   - Dialog shows user's email for verification
   - "Delete User" and "Cancel" buttons available

3. **Confirm deletion:**
   - Read the warning message
   - Click "Delete User" to confirm
   - Loading state shows on button

4. **Verify removal:**
   - User disappears from the list
   - User count decreases
   - Success notification appears

**Expected Result:**
- User permanently removed from system
- No way to undo (as warned in dialog)
- Clean removal with proper feedback

## 🔄 User Impersonation

### Example 6: Testing as Different Users

**Scenario:** Test the main application as a specific user

**Steps:**
1. **Identify target user** in the list
   - Example: "qa.tester@example.com"

2. **Click "Login as User"** button
   - Button shows loading state
   - Text changes to "Logging in..."

3. **Automatic redirect occurs:**
   - Browser navigates to main application
   - User is automatically logged in
   - Main app shows user as authenticated

4. **Verify authentication:**
   - Check user profile in main app
   - Confirm correct user is logged in
   - Test user-specific functionality

**Expected Result:**
- Seamless transition to main application
- User authenticated without manual login
- Ready to test user-specific features

### Example 7: Impersonation Error Handling

**Scenario:** Handle impersonation failures gracefully

**Steps:**
1. **Attempt impersonation** when main app is down
2. **Observe error handling:**
   - Error message appears in UI
   - Specific error details provided
   - Option to retry the operation

3. **Start main application** and retry
4. **Successful impersonation** occurs

**Expected Result:**
- Clear error messages when issues occur
- Graceful degradation without crashes
- Retry functionality works properly

## 🔍 Search and Navigation

### Example 8: Finding Users Efficiently

**Scenario:** Locate specific users in a large list

**Steps:**
1. **Use the search box:**
   - Type "admin" to find admin users
   - Results filter in real-time
   - User count updates: "2 of 15 users"

2. **Try different search terms:**
   - Search by email domain: "@example.com"
   - Search by display name: "QA"
   - Clear search to see all users

3. **Sort the results:**
   - Click "Email" column header to sort by email
   - Click again to reverse sort order
   - Try sorting by "Created" date

**Expected Result:**
- Instant search results as you type
- Multiple search criteria work
- Sorting helps organize large lists

### Example 9: Managing Large User Lists

**Scenario:** Work with 50+ test users efficiently

**Steps:**
1. **Use search strategically:**
   - Search for specific user types
   - Filter by email patterns
   - Use display name keywords

2. **Leverage sorting:**
   - Sort by creation date to find newest users
   - Sort by email for alphabetical order
   - Sort by name for display name order

3. **Monitor user count:**
   - Keep track of filtered vs. total users
   - Use count to verify search results

**Expected Result:**
- Efficient navigation of large datasets
- Quick location of specific users
- Clear indication of search scope

## ⚠️ Error Handling

### Example 10: Network Connectivity Issues

**Scenario:** Handle API service downtime

**Steps:**
1. **Stop the API service:**
   ```bash
   docker-compose stop mock-api
   ```

2. **Refresh the UI:**
   - Error message appears
   - "Failed to load users" notification
   - Retry button available

3. **Try user operations:**
   - Attempt to create user
   - Clear error messages appear
   - No data loss or corruption

4. **Restart API service:**
   ```bash
   docker-compose start mock-api
   ```

5. **Use retry functionality:**
   - Click retry buttons
   - Data loads successfully
   - Normal operation resumes

**Expected Result:**
- Graceful handling of network issues
- Clear error messages and recovery options
- No data loss during outages

### Example 11: Validation and Form Errors

**Scenario:** Handle various input validation scenarios

**Steps:**
1. **Test duplicate email creation:**
   - Try to create user with existing email
   - Server returns validation error
   - Clear error message displayed

2. **Test network timeout:**
   - Submit form during network issues
   - Timeout error handled gracefully
   - Form data preserved for retry

3. **Test malformed data:**
   - Submit invalid JSON scenarios
   - Server validation errors displayed
   - User guided to fix issues

**Expected Result:**
- Comprehensive error handling
- User-friendly error messages
- Guidance for error resolution

## 📱 Mobile Usage

### Example 12: Mobile Device Testing

**Scenario:** Use the interface on a mobile device

**Steps:**
1. **Access on mobile browser:**
   - Navigate to http://localhost:3002
   - Interface adapts to screen size
   - Touch-friendly button sizes

2. **Test mobile interactions:**
   - Tap "Add New User" button
   - Form inputs work with mobile keyboard
   - Validation messages clearly visible

3. **Test table interactions:**
   - Horizontal scrolling if needed
   - Action buttons remain accessible
   - Search functionality works with mobile keyboard

4. **Test modal dialogs:**
   - Forms fit mobile screen
   - Easy to dismiss and navigate
   - Keyboard doesn't obscure content

**Expected Result:**
- Fully functional mobile experience
- Responsive design adapts properly
- Touch interactions work smoothly

## ♿ Accessibility Features

### Example 13: Screen Reader Usage

**Scenario:** Navigate the interface using a screen reader

**Steps:**
1. **Enable screen reader** (NVDA, JAWS, VoiceOver)

2. **Navigate the interface:**
   - Header announces "User Management"
   - Table structure is properly announced
   - Form labels are clearly read

3. **Use keyboard navigation:**
   - Tab through interactive elements
   - Enter/Space activate buttons
   - Escape closes dialogs

4. **Test form interactions:**
   - Field labels announced clearly
   - Validation errors read aloud
   - Success messages communicated

**Expected Result:**
- Full screen reader compatibility
- Logical tab order and navigation
- Clear audio feedback for all actions

### Example 14: Keyboard-Only Navigation

**Scenario:** Use the interface without a mouse

**Steps:**
1. **Navigate using only keyboard:**
   - Tab to "Add New User" button
   - Press Enter to open form
   - Tab through form fields

2. **Complete form with keyboard:**
   - Type in all required fields
   - Tab to "Create User" button
   - Press Enter to submit

3. **Navigate user list:**
   - Tab to table elements
   - Use arrow keys if supported
   - Access action buttons via Tab

4. **Handle dialogs:**
   - Tab to dialog buttons
   - Use Escape to cancel
   - Enter to confirm actions

**Expected Result:**
- Complete keyboard accessibility
- Logical focus management
- No mouse-dependent functionality

## 🎯 Best Practices

### Efficient Workflow Tips

1. **Batch User Creation:**
   - Create multiple users in sequence
   - Use consistent naming patterns
   - Document user purposes

2. **Organized Testing:**
   - Use descriptive display names
   - Group users by test scenario
   - Clean up unused test users

3. **Search Optimization:**
   - Use email domains for filtering
   - Search by user roles or types
   - Leverage sorting for organization

4. **Error Recovery:**
   - Always check error messages
   - Use retry functionality
   - Verify operations completed

### Security Considerations

1. **Test Data Only:**
   - Never use real user information
   - Use obviously fake email addresses
   - Use simple, non-sensitive passwords

2. **Environment Isolation:**
   - Only use in development/testing
   - Never deploy to production
   - Regularly clean up test data

3. **Access Control:**
   - Limit access to development team
   - Document who has access
   - Monitor usage in shared environments

## 📊 Performance Tips

### Optimizing Large User Lists

1. **Use Search Effectively:**
   - Filter before browsing
   - Use specific search terms
   - Clear search when done

2. **Manage User Count:**
   - Delete unused test users
   - Keep active user count reasonable
   - Archive old test scenarios

3. **Browser Performance:**
   - Refresh page if sluggish
   - Clear browser cache periodically
   - Use modern browser versions

This comprehensive guide should help you make the most of the User Management UI for your testing and development needs.