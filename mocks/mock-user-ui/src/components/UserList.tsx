import React, { useState, useEffect, useMemo } from 'react';
import { User, ApiError } from '../types';
import { userService } from '../services';
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

  const handleLoginAsUser = async (user: User) => {
    try {
      await userService.loginAsUser(user.uid);
    } catch (err) {
      const apiError = err as ApiError;
      alert(`Failed to login as user: ${apiError.message}`);
    }
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

  if (error) {
    return (
      <div className="user-list">
        <div className="error-container">
          <div className="error-message">
            <h3>Error Loading Users</h3>
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-list">
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
                        className="action-button login-button"
                        title="Login as this user"
                      >
                        Login as User
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
                      {onDeleteUser && (
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="action-button delete-button"
                          title="Delete user"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};