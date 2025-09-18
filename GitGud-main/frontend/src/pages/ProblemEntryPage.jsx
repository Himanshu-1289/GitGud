import React, { useState, useEffect } from 'react';
import "../ProblemEntryPage.css";
import Navbar from '@/components/ui/navbar';
import { useAxiosPrivate } from '@/axios';
import { useNavigate } from 'react-router-dom';
import Spinner  from '@/components/ui/spinner';

const PopulatedProblemGridDemo = () => {
  const [problemData, setProblemData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const axiosPrivateInstance = useAxiosPrivate();
  const [totalPages, setTotalPages] = useState(0);
  const GRID_SIZE = 9;
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [newProblemName, setNewProblemName] = useState('');
  const [newProblemUrl, setNewProblemUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch problems from the API
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const resList = await axiosPrivateInstance.get(`/chats?skip=${(currentPage-1)*GRID_SIZE}&limit=${GRID_SIZE}`);
        setProblemData(resList.data || []);
        const resLen = await axiosPrivateInstance.get(`/len_chat`);
        setTotalPages((Math.floor((resLen.data.length || 0) / GRID_SIZE))+1);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    fetchProblems();
  }, [currentPage]);

  // Open the URL input modal
  const openUrlModal = () => {
    setError('');
    setIsModalOpen(true);
  };

  // Close the URL input modal
  const closeUrlModal = () => {
    setIsModalOpen(false);
    setNewProblemName('');
    setNewProblemUrl('');
    setError('');
    setIsSubmitting(false);
  };

  // Submit a new problem to the API
  const handleSubmitProblem = async () => {
    if (!newProblemUrl.trim()) {
      setError('Please enter a problem URL');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      let chat_data;
      if (newProblemName.trim() === '') {
        chat_data = await axiosPrivateInstance.post('/create_chat', { problem_url: newProblemUrl });
      } else {
        chat_data = await axiosPrivateInstance.post('/create_chat', {
          problem_nickname: newProblemName,
          problem_url: newProblemUrl,
        });
      }
      navigate(`/chat/${chat_data.data.chat_id}`);
    } catch (error) {
      console.error('Error submitting problem:', error);
      setError('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination handlers omitted for brevity...
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const renderPaginationNumbers = () => {
    const pages = [];
    pages.push(
      <button key={1} className={`url-grid-pagination-number ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
    );
    if (totalPages > 5) {
      if (currentPage > 3) pages.push(<span key="e1" className="url-grid-pagination-ellipsis">...</span>);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(
        <button key={i} className={`url-grid-pagination-number ${currentPage === i ? 'active' : ''}`} onClick={() => setCurrentPage(i)}>{i}</button>
      );
      if (currentPage < totalPages - 2) pages.push(<span key="e2" className="url-grid-pagination-ellipsis">...</span>);
    } else {
      for (let i = 2; i < totalPages; i++) pages.push(
        <button key={i} className={`url-grid-pagination-number ${currentPage === i ? 'active' : ''}`} onClick={() => setCurrentPage(i)}>{i}</button>
      );
    }
    if (totalPages > 1) pages.push(
      <button key={totalPages} className={`url-grid-pagination-number ${currentPage === totalPages ? 'active' : ''}`} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
    );
    return pages;
  };

  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="url-grid-page">
        <div className="url-grid-wrapper">
          <div className="url-grid-container">
            <div className="url-grid-header">
              <h2>Problems</h2>
              <div className="url-grid-page-indicator">Page {currentPage} of {totalPages}</div>
            </div>

            <div className="url-grid">
              {problemData.map((problem, index) => (
                <div key={index} className={`url-grid-cell ${hoveredCell === index ? 'url-grid-cell-hover' : ''}`} onMouseEnter={() => setHoveredCell(index)} onMouseLeave={() => setHoveredCell(null)}>
                  <div className="url-grid-url-display" onClick={() => navigate(`/chat/${problem._id}`)}>
                    <div className="url-grid-problem-name text-center">{problem.problem}</div>
                    <div className="url-grid-url-favicon"><div className="favicon-placeholder"></div></div>
                  </div>
                </div>
              ))}
              <div className={`url-grid-cell ${hoveredCell === GRID_SIZE - 1 ? 'url-grid-cell-hover' : ''}`} onMouseEnter={() => setHoveredCell(GRID_SIZE - 1)} onMouseLeave={() => setHoveredCell(null)}>
                <button className="url-grid-add-button" onClick={openUrlModal}><span className="plus-icon">+</span></button>
              </div>
            </div>

            <div className="url-grid-pagination">
              <button className={`url-grid-pagination-nav ${currentPage === 1 ? 'disabled' : ''}`} onClick={goToPrevPage} disabled={currentPage === 1}>← Prev</button>
              <div className="url-grid-pagination-numbers">{renderPaginationNumbers()}</div>
              <button className={`url-grid-pagination-nav ${currentPage === totalPages ? 'disabled' : ''}`} onClick={goToNextPage} disabled={currentPage === totalPages}>Next →</button>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="url-grid-modal" onClick={(e) => e.target === e.currentTarget && closeUrlModal()}>
            <div className="url-grid-modal-content">
              <h3>Add Problem URL</h3>
              <div className="url-grid-form-group space-y-2">
                <input type="text" placeholder="Enter Problem Nickname (optional)" value={newProblemName} onChange={(e) => setNewProblemName(e.target.value)} autoFocus className="w-full p-2 border rounded" />
                <input type="url" placeholder="Enter LeetCode problem URL" value={newProblemUrl} onChange={(e) => setNewProblemUrl(e.target.value)} className="w-full p-2 border rounded" />
                {error && <div className="text-sm text-red-500">{error}</div>}
              </div>
              <div className="url-grid-buttons flex justify-end space-x-2">
                <button className="url-grid-btn url-grid-btn-cancel px-4 py-2 border rounded" onClick={closeUrlModal} disabled={isSubmitting}>Cancel</button>
                <button className="url-grid-btn url-grid-btn-submit px-4 py-2 bg-blue-600 text-white rounded flex items-center" onClick={handleSubmitProblem} disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopulatedProblemGridDemo;
