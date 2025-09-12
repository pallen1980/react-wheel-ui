import React, { useState, useEffect, useMemo } from 'react';
import { User, ApiError } from '../types';
import { userService } from '../services';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorMessage } from './ErrorMessage';
import './UserList.scss';

interface UserListProps {
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export const UserList: React.FC<UserListProps> = ({
  onEditUser,
  onDeleteUser,
  refreshTrigger = 0
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof User>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort users
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, sortField, sortDirection]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleLoginAsUser = async (user: User) => {
    try {
      setImpersonatingUserId(user.uid);
      setError(null);
      
      // Get main app URL from environment or use default
      const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';
      
      await userService.loginAsUser(user.uid, mainAppUrl);
      
      // If we reach here, something went wrong with the redirect
      setImpersonatingUserId(null);
      setError('Redirect to main application failed. Please try again.');
    } catch (err) {
      setImpersonatingUserId(null);
      const apiError = err as ApiError;
      setError(`Failed to login as ${user.email}: ${apiError.message}`);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeletingUser(true);
      setError(null);
      
      await userService.deleteUser(userToDelete.uid);
      
      // Update the users list by removing the deleted user
      setUsers(prevUsers => prevUsers.filter(u => u.uid !== userToDelete.uid));
      
      // Close the dialog
      setUserToDelete(null);
      
      // Call the onDeleteUser callback if provided
      if (onDeleteUser) {
        onDeleteUser(userToDelete);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(`Failed to delete user ${userToDelete.email}: ${apiError.message}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
  };

  const handleRetry = () => {
    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, [refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (field: keyof User) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="user-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="user-list">
        <ErrorMessage
          message={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="user-list">
      {error && (
        <ErrorMessage
          message={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
          className="inline"
        />
      )}
      
      <div className="user-list-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="user-count">
          {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <p>No users found matching "{searchTerm}"</p>
          ) : (
            <p>No users available. Create your first user to get started.</p>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('email')}
                  className="sortable"
                >
                  Email {getSortIcon('email')}
                </th>
                <th 
                  onClick={() => handleSort('displayName')}
                  className="sortable"
                >
                  Display Name {getSortIcon('displayName')}
                </th>
                <th 
                  onClick={() => handleSort('createdAt')}
                  className="sortable"
                >
                  Created {getSortIcon('createdAt')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.uid}>
                  <td className="email-cell">{user.email}</td>
                  <td className="name-cell">{user.displayName}</td>
                  <td className="date-cell">{formatDate(user.createdAt)}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleLoginAsUser(user)}
                        className={`action-button login-button ${impersonatingUserId === user.uid ? 'loading' : ''}`}
                        disabled={impersonatingUserId === user.uid}
                        title={impersonatingUserId === user.uid ? 'Logging in...' : 'Login as this user'}
                      >
                        {impersonatingUserId === user.uid ? (
                          <>
                            <span className="loading-spinner-small"></span>
                            Logging in...
                          </>
                        ) : (
                          'Login as User'
                        )}
                      </button>
                      {onEditUser && (
                        <button
                          onClick={() => onEditUser(user)}
                          className="action-button edit-button"
                          title="Edit user"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="action-button delete-button"
                        title="Delete user"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={userToDelete !== null}
        title="Delete User"
        message={
          userToDelete 
            ? `Are you sure you want to delete the user "${userToDelete.email}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive={true}
        isLoading={isDeletingUser}
      />
    </div>
  );
};