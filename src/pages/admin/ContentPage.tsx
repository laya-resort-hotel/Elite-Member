import { useEffect, useState } from 'react';
import { getEditableBenefits, getEditableNews, saveBenefit, saveNewsItem } from '../../lib/services/contentService';
import type { Benefit, NewsItem } from '../../lib/types';

export default function ContentPage() {
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState<'News' | 'Promotion'>('News');
  const [newsSummary, setNewsSummary] = useState('');
  const [benefitTitle, setBenefitTitle] = useState('');
  const [benefitTag, setBenefitTag] = useState('Dining');
  const [benefitDescription, setBenefitDescription] = useState('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadContent() {
    try {
      const [newsData, benefitData] = await Promise.all([getEditableNews(), getEditableBenefits()]);
      setNewsItems(newsData);
      setBenefits(benefitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load content.');
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

  async function handlePublishNews() {
    setMessage('');
    setError('');
    try {
      await saveNewsItem({ title: newsTitle, excerpt: newsSummary, category: newsCategory, isPublished: true });
      setNewsTitle('');
      setNewsSummary('');
      setNewsCategory('News');
      setMessage('News item saved successfully.');
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save news item.');
    }
  }

  async function handleSaveBenefit() {
    setMessage('');
    setError('');
    try {
      await saveBenefit({ title: benefitTitle, description: benefitDescription, tag: benefitTag, active: true });
      setBenefitTitle('');
      setBenefitTag('Dining');
      setBenefitDescription('');
      setMessage('Benefit saved successfully.');
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save benefit.');
    }
  }

  return (
    <div className="stack-lg">
      {message ? <div className="success-text">{message}</div> : null}
      {error ? <div className="error-text">{error}</div> : null}

      <section className="panel form-panel">
        <div className="section-head">
          <h3>News Editor</h3>
          <button className="primary-button" type="button" onClick={() => void handlePublishNews()}>
            Publish
          </button>
        </div>
        <div className="form-grid single-column">
          <label>
            Title
            <input value={newsTitle} onChange={(event) => setNewsTitle(event.target.value)} placeholder="Resident Spring Preview" />
          </label>
          <label>
            Category
            <select value={newsCategory} onChange={(event) => setNewsCategory(event.target.value as 'News' | 'Promotion')}>
              <option>News</option>
              <option>Promotion</option>
            </select>
          </label>
          <label>
            Summary
            <textarea rows={4} value={newsSummary} onChange={(event) => setNewsSummary(event.target.value)} placeholder="Write a polished summary for resident members..." />
          </label>
        </div>
        <div className="stack-sm top-space">
          {newsItems.slice(0, 5).map((item) => (
            <article key={item.id} className="row-card">
              <div>
                <strong>{item.title}</strong>
                <div className="muted">{item.category}</div>
              </div>
              <span className="pill small">{item.isPublished ? 'published' : 'draft'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel form-panel">
        <div className="section-head">
          <h3>Benefit Editor</h3>
          <button className="secondary-button" type="button" onClick={() => void handleSaveBenefit()}>
            Save Benefit
          </button>
        </div>
        <div className="form-grid single-column">
          <label>
            Benefit Title
            <input value={benefitTitle} onChange={(event) => setBenefitTitle(event.target.value)} placeholder="Dining Privilege" />
          </label>
          <label>
            Tag
            <input value={benefitTag} onChange={(event) => setBenefitTag(event.target.value)} placeholder="Dining" />
          </label>
          <label>
            Description
            <textarea rows={4} value={benefitDescription} onChange={(event) => setBenefitDescription(event.target.value)} placeholder="Describe the benefit clearly for resident members..." />
          </label>
        </div>
        <div className="stack-sm top-space">
          {benefits.slice(0, 5).map((item) => (
            <article key={item.id} className="row-card">
              <div>
                <strong>{item.title}</strong>
                <div className="muted">{item.description}</div>
              </div>
              <span className="pill small">{item.tag}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
