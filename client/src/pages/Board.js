import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import API from '../api/axios';

const Board = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [showListForm, setShowListForm] = useState(false);
  const [newCardTitles, setNewCardTitles] = useState({});
  const [showCardForm, setShowCardForm] = useState({});
  const [cards, setCards] = useState({});

  useEffect(() => {
    fetchBoard();
    fetchLists();
  }, [id]);

  const fetchBoard = async () => {
    try {
      const { data } = await API.get(`/boards/${id}`);
      setBoard(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchLists = async () => {
    try {
      const { data } = await API.get(`/lists/${id}`);
      setLists(data);
      data.forEach((list) => fetchCards(list._id));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCards = async (listId) => {
    try {
      const { data } = await API.get(`/cards/${listId}`);
      setCards((prev) => ({ ...prev, [listId]: data }));
    } catch (error) {
      console.log(error);
    }
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const { data } = await API.post('/lists', {
        title: newListTitle,
        boardId: id,
        position: lists.length,
      });
      setLists([...lists, data]);
      setCards((prev) => ({ ...prev, [data._id]: [] }));
      setNewListTitle('');
      setShowListForm(false);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteList = async (listId) => {
    try {
      await API.delete(`/lists/${listId}`);
      setLists(lists.filter((l) => l._id !== listId));
      setCards((prev) => {
        const updated = { ...prev };
        delete updated[listId];
        return updated;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const createCard = async (listId) => {
    const title = newCardTitles[listId];
    if (!title?.trim()) return;
    try {
      const { data } = await API.post('/cards', {
        title,
        listId,
        boardId: id,
        position: (cards[listId] || []).length,
      });
      setCards((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] || []), data],
      }));
      setNewCardTitles((prev) => ({ ...prev, [listId]: '' }));
      setShowCardForm((prev) => ({ ...prev, [listId]: false }));
    } catch (error) {
      console.log(error);
    }
  };

  const deleteCard = async (cardId, listId) => {
    try {
      await API.delete(`/cards/${cardId}`);
      setCards((prev) => ({
        ...prev,
        [listId]: prev[listId].filter((c) => c._id !== cardId),
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any list
    if (!destination) return;

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    const sourceCards = Array.from(cards[sourceListId] || []);
    const destCards =
      sourceListId === destListId
        ? sourceCards
        : Array.from(cards[destListId] || []);

    // Remove card from source
    const [movedCard] = sourceCards.splice(source.index, 1);

    if (sourceListId === destListId) {
      // Same list reorder
      sourceCards.splice(destination.index, 0, movedCard);
      setCards((prev) => ({
        ...prev,
        [sourceListId]: sourceCards,
      }));
    } else {
      // Move to different list
      destCards.splice(destination.index, 0, movedCard);
      setCards((prev) => ({
        ...prev,
        [sourceListId]: sourceCards,
        [destListId]: destCards,
      }));

      // Persist new list to database
      try {
        await API.put(`/cards/${draggableId}`, {
          list: destListId,
          position: destination.index,
        });
      } catch (error) {
        console.log('Failed to update card position:', error);
      }
    }
  };

  return (
    <div
      style={{
        ...styles.container,
        background: board?.background || '#0079BF',
      }}
    >
      {/* Navbar */}
      <div style={styles.navbar}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 style={styles.boardTitle}>{board?.title}</h1>
      </div>

      {/* Drag and Drop Context wraps everything */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={styles.listsContainer}>
          {lists.map((list) => (
            <div key={list._id} style={styles.list}>
              {/* List Header */}
              <div style={styles.listHeader}>
                <h3 style={styles.listTitle}>{list.title}</h3>
                <button
                  style={styles.deleteListBtn}
                  onClick={() => deleteList(list._id)}
                >
                  ✕
                </button>
              </div>

              {/* Droppable area for cards */}
              <Droppable droppableId={list._id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      ...styles.cardsContainer,
                      background: snapshot.isDraggingOver
                        ? 'rgba(0,121,191,0.1)'
                        : 'transparent',
                      minHeight: '8px',
                      borderRadius: '6px',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {(cards[list._id] || []).map((card, index) => (
                      <Draggable
                        key={card._id}
                        draggableId={card._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...styles.card,
                              boxShadow: snapshot.isDragging
                                ? '0 8px 20px rgba(0,0,0,0.3)'
                                : '0 1px 3px rgba(0,0,0,0.1)',
                              transform: snapshot.isDragging
                                ? 'rotate(2deg) scale(1.02)'
                                : 'rotate(0deg) scale(1)',
                              opacity: snapshot.isDragging ? 0.95 : 1,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <span style={styles.cardTitle}>{card.title}</span>
                            <button
                              style={styles.deleteCardBtn}
                              onClick={() => deleteCard(card._id, list._id)}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Card */}
              {showCardForm[list._id] ? (
                <div style={styles.cardForm}>
                  <textarea
                    style={styles.cardInput}
                    placeholder="Enter card title..."
                    value={newCardTitles[list._id] || ''}
                    onChange={(e) =>
                      setNewCardTitles((prev) => ({
                        ...prev,
                        [list._id]: e.target.value,
                      }))
                    }
                    autoFocus
                  />
                  <div style={styles.cardFormButtons}>
                    <button
                      style={styles.addCardBtn}
                      onClick={() => createCard(list._id)}
                    >
                      Add Card
                    </button>
                    <button
                      style={styles.cancelBtn}
                      onClick={() =>
                        setShowCardForm((prev) => ({
                          ...prev,
                          [list._id]: false,
                        }))
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={styles.addCardTrigger}
                  onClick={() =>
                    setShowCardForm((prev) => ({
                      ...prev,
                      [list._id]: true,
                    }))
                  }
                >
                  + Add a card
                </button>
              )}
            </div>
          ))}

          {/* Add List */}
          <div style={styles.addListContainer}>
            {showListForm ? (
              <div style={styles.listForm}>
                <form onSubmit={createList}>
                  <input
                    style={styles.listInput}
                    type="text"
                    placeholder="Enter list title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    autoFocus
                  />
                  <div style={styles.listFormButtons}>
                    <button style={styles.addListBtn} type="submit">
                      Add List
                    </button>
                    <button
                      style={styles.cancelBtn}
                      type="button"
                      onClick={() => setShowListForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                style={styles.addListTrigger}
                onClick={() => setShowListForm(true)}
              >
                + Add another list
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
  },
  navbar: {
    background: 'rgba(0,0,0,0.2)',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  boardTitle: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '600',
  },
  listsContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '24px',
    overflowX: 'auto',
    minHeight: 'calc(100vh - 60px)',
  },
  list: {
    background: '#ebecf0',
    borderRadius: '10px',
    padding: '12px',
    width: '272px',
    minWidth: '272px',
    maxHeight: 'calc(100vh - 120px)',
    overflowY: 'auto',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  listTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
  },
  deleteListBtn: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '8px',
    padding: '4px',
  },
  card: {
    background: 'white',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab',
    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
  },
  cardTitle: {
    fontSize: '14px',
    color: '#333',
    flex: 1,
  },
  deleteCardBtn: {
    background: 'transparent',
    border: 'none',
    color: '#aaa',
    fontSize: '12px',
    cursor: 'pointer',
  },
  cardForm: {
    marginTop: '8px',
  },
  cardInput: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    resize: 'none',
    height: '60px',
    marginBottom: '8px',
  },
  cardFormButtons: {
    display: 'flex',
    gap: '8px',
  },
  addCardBtn: {
    background: '#0079BF',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  addCardTrigger: {
    background: 'transparent',
    border: 'none',
    color: '#555',
    fontSize: '14px',
    padding: '6px 8px',
    borderRadius: '6px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  },
  addListContainer: {
    minWidth: '272px',
  },
  listForm: {
    background: '#ebecf0',
    borderRadius: '10px',
    padding: '12px',
  },
  listInput: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginBottom: '8px',
  },
  listFormButtons: {
    display: 'flex',
    gap: '8px',
  },
  addListBtn: {
    background: '#0079BF',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  addListTrigger: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  },
  cancelBtn: {
    background: 'transparent',
    color: '#555',
    border: 'none',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default Board;