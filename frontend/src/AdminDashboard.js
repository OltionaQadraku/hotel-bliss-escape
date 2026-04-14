import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Alert } from 'react-bootstrap';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType')?.trim().toLowerCase();

    if (!token || userType !== 'admin') {
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('userType');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const response = await axios.get('http://localhost:8000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesioni juaj ka skaduar. Ju lutemi hyni përsëri.');
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('userType');
        navigate('/login', { replace: true });
      } else {
        setError('Gabim në server. Ju lutemi provoni përsëri më vonë.');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getActionTranslation = (action) => {
    const actionMap = {
      'cleaned room': 'Pastroi dhomën',
      'uncleaned room': 'Dhoma e papastër',
      'created reservation': 'Krijoi rezervim',
      'updated reservation': 'Përditësoi rezervimin',
      'cancelled reservation': 'Anuloi rezervimin',
      'processed payment': 'Regjistroi pagesën',
    };
    return actionMap[action] || 'Veprim i panjohur';
  };

  return (
    <div className="container py-5">
      <h1>Paneli i Administratorit</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {dashboardData ? (
        <>
          {/* Seksioni 1: Statistikat dhe Menaxhimi i Përdoruesve */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Përdoruesit</h5>
                  <p className="card-text">Numri total: {dashboardData.stats.total_users}</p>
                  <p className="card-text">Admin: {dashboardData.stats.admins}</p>
                  <p className="card-text">Recepsionistë: {dashboardData.stats.receptionists}</p>
                  <p className="card-text">Pastrues: {dashboardData.stats.cleaners}</p>
                  <p className="card-text">Aktivë: {dashboardData.stats.active_users}</p>
                  <div className="d-flex gap-2 mt-3">
                    <Link to="/users" className="btn btn-primary">
                      Shiko Përdoruesit
                    </Link>
                    <Link
                      to={{
                        pathname: '/schedules',
                        state: { authToken: localStorage.getItem('token') },
                      }}
                      className="btn btn-secondary"
                    >
                      Menaxho Oraret
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Seksioni 2: Butonat për Ligjëruesit dhe Ligjëratat */}
           
          </div>
          
          {/* Seksioni 3: Aktivitetet e Fundit */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Aktivitetet e Fundit</h5>
                  {dashboardData.activities && dashboardData.activities.length > 0 ? (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Përdoruesi</th>
                          <th>Roli</th>
                          <th>Veprimi</th>
                          <th>Objekti</th>
                          <th>Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.activities.map((activity) => (
                          <tr key={activity.id}>
                            <td>{activity.user_name || 'I panjohur'}</td>
                            <td>
                              {activity.user_role === 'cleaner'
                                ? 'Pastrues'
                                : activity.user_role === 'receptionist'
                                ? 'Recepsionist'
                                : activity.user_role === 'admin'
                                ? 'Admin'
                                : activity.user_role || 'N/A'}
                            </td>
                            <td>{getActionTranslation(activity.action)}</td>
                            <td>{activity.target || 'N/A'}</td>
                            <td>{new Date(activity.created_at).toLocaleString('sq-AL')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted">Nuk ka aktivitete të regjistruara.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        !error && <p>Duke u ngarkuar...</p>
      )}
    </div>
  );
};

export default AdminDashboard;