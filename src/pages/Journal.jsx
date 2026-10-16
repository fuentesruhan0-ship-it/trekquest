import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, Trash2, ChevronLeft } from 'lucide-react';

export default function Journal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const fromHike = searchParams.get('from') === 'hike';

  // Load entries from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trekquest_journal_entries');
      if (saved) {
        setEntries(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading entries:', e);
    }
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    const newEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem('trekquest_journal_entries', JSON.stringify(updated));
    
    setTitle('');
    setContent('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('trekquest_journal_entries', JSON.stringify(updated));
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
        backdropFilter: 'blur(8px)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
        padding: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(20, 184, 166, 0.2)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              color: '#2dd4bf',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>Travel Journal</h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Save your hiking memories</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: '#0d9488',
            color: 'white',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} /> New Journal Entry
        </button>

        {showForm && (
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px',
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your journal entry here..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                resize: 'none',
                minHeight: '120px'
              }}
              rows={5}
            />
            <button
              onClick={handleSave}
              style={{
                width: '100%',
                backgroundColor: '#0f766e',
                color: 'white',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Save Entry
            </button>
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <BookOpen size={40} style={{ opacity: 0.4, margin: '0 auto' }} />
              <p style={{ fontSize: '14px', marginTop: '8px' }}>No journal entries yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {entries.map((e) => (
                <div key={e.id} style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0 0' }}>{e.date}</p>
                    </div>
                    <button onClick={() => handleDelete(e.id)} style={{ padding: '6px', color: '#f87171', border: 'none', background: 'none', cursor: 'pointer' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {e.content && <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '8px', lineHeight: '1.5' }}>{e.content}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}