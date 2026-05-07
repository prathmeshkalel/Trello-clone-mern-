import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const colors = ['#0079BF', '#D29034', '#519839', '#B04632', '#89609E', '#CD5A91'];

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await API.get('/boards');
      setBoards(data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const { data } = await API.post('/boards', {
        title,
        background: randomColor
      });
      setBoards([...boards, data]);
      setTitle('');
      setShowForm(false);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteBoard = async (id) => {
    try {
      await API.delete(`/boards/${id}`);
      setBoards(boards.filter((b) => b._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 style={styles.logo}>🟦 Trello Clone</h1>
        <div style={styles.navRight}>
          <span style={styles.welcome}>👋 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <h2 style={styles.heading}>My Boards</h2>

        {loading ? (
          <p>Loading boards...</p>
        ) : (
          <div style={styles.grid}>
            {/* Existing Boards */}
            {boards.map((board) => (
              <div
                key={board._id}
                style={{ ...styles.boardCard, background: board.background }}
              >
                <div
                  style={styles.boardTitle}
                  onClick={() => navigate(`/board/${board._id}`)}
                >
                  {board.title}
                </div>
                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteBoard(board._id)}
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Create New Board */}
            {showForm ? (
              <div style={styles.createCard}>
                <form onSubmit={createBoard}>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Board title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                  <div style={styles.formButtons}>
                    <button style={styles.addBtn} type="submit">Add Board</button>
                    <button
                      style={styles.cancelBtn}
                      type="button"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                style={styles.newBoard}
                onClick={() => setShowForm(true)}
              >
                + Create new board
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
  },
  navbar: {
    background: '#0079BF',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: 'white',
    fontSize: '22px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  welcome: {
    color: 'white',
    fontSize: '14px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  main: {
    padding: '32px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#333',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  boardCard: {
    borderRadius: '10px',
    padding: '16px',
    height: '120px',
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  boardTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: '16px',
    flex: 1,
  },
  deleteBtn: {
    background: 'rgba(0,0,0,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    width: '24px',
    height: '24px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBoard: {
    background: 'rgba(0,0,0,0.08)',
    borderRadius: '10px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#555',
    fontWeight: '500',
    fontSize: '15px',
  },
  createCard: {
    background: '#ebecf0',
    borderRadius: '10px',
    padding: '16px',
    height: '120px',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginBottom: '8px',
  },
  formButtons: {
    display: 'flex',
    gap: '8px',
  },
  addBtn: {
    background: '#0079BF',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  cancelBtn: {
    background: 'transparent',
    color: '#555',
    border: 'none',
    padding: '6px 12px',
    fontSize: '13px',
  },
};

export default Dashboard;