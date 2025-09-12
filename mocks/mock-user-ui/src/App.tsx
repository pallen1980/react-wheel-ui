import { useState } from 'react';
import { UserList, UserForm, ToastContainer } from './components';
import { User } from './types';
import { useToast } from './hooks';
import './App.scss';

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormVisible(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormVisible(true);
  };

  const handleFormClose = () => {
    setSelectedUser(null);
    setIsFormVisible(false);
  };

  const handleUserSaved = (user: User, isNew: boolean) => {
    setIsFormVisible(false);
    setSelectedUser(null);
    setRefreshTrigger(prev => prev + 1);
    
    if (isNew) {
      showSuccess(`User "${user.email}" created successfully`);
    } else {
      showSuccess(`User "${user.email}" updated successfully`);
    }
  };

  const handleUserDeleted = (user: User) => {
    setRefreshTrigger(prev => prev + 1);
    showSuccess(`User "${user.email}" deleted successfully`);
  };

  const handleFormError = (error: string) => {
    showError(error);
  };

  return (
    <div className="app">
      <header className="app-header" role="banner">
        <div className="header-content">
          <div className="header-text">
            <h1>User Management</h1>
            <p>Manage test users for development and testing</p>
          </div>
          <button 
            onClick={handleAddUser}
            className="add-user-button"
            aria-label="Add new test user"
          >
            Add New User
          </button>
        </div>
      </header>
      
      <main className="app-main" role="main">
        <UserList
          onEditUser={handleEditUser}
          onDeleteUser={handleUserDeleted}
          refreshTrigger={refreshTrigger}
        />
      </main>

      {isFormVisible && (
        <UserForm
          user={selectedUser}
          onSave={handleUserSaved}
          onCancel={handleFormClose}
          onError={handleFormError}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;