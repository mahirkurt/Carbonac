import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DataTable,
  Dropdown,
  InlineLoading,
  InlineNotification,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tile,
} from '@carbon/react';
import { Renew, WarningAlt } from '@carbon/icons-react';

import { useAuth } from '../../contexts';

const headers = [
  { key: 'type', header: 'İş Türü' },
  { key: 'status', header: 'Durum' },
  { key: 'created', header: 'Başlangıç' },
  { key: 'updated', header: 'Güncellendi' },
];

const statusOptions = [
  { id: 'all', text: 'Tümü' },
  { id: 'queued', text: 'Kuyrukta' },
  { id: 'processing', text: 'İşleniyor' },
  { id: 'completed', text: 'Tamamlandı' },
  { id: 'failed', text: 'Hata' },
  { id: 'cancelled', text: 'İptal' },
];

const pageSizes = [5, 10, 20, 50];

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '-';
  return date.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapStatusTag(status) {
  switch (status) {
    case 'completed':
      return { type: 'green', label: 'Tamamlandı' };
    case 'processing':
      return { type: 'blue', label: 'İşleniyor' };
    case 'queued':
      return { type: 'purple', label: 'Kuyrukta' };
    case 'failed':
      return { type: 'red', label: 'Hata' };
    case 'cancelled':
      return { type: 'gray', label: 'İptal' };
    default:
      return { type: 'gray', label: status || 'Bilinmiyor' };
  }
}

async function fetchJson(path, options = {}) {
  const token = typeof window !== 'undefined'
    ? window.localStorage.getItem('carbonac_token')
    : null;
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || 'İstek başarısız.';
    throw new Error(message);
  }
  return payload;
}

export default function JobsPanel() {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState({ retry: false, cancel: false });
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!isAuthenticated) {
      setJobs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * pageSize;
      const statusParam = statusFilter?.id && statusFilter.id !== 'all'
        ? `&status=${encodeURIComponent(statusFilter.id)}`
        : '';
      const payload = await fetchJson(`/api/jobs?limit=${pageSize}&offset=${offset}${statusParam}`);
      setJobs(Array.isArray(payload.jobs) ? payload.jobs : []);
      setTotal(payload.total || 0);
      if (!selectedJobId && payload.jobs?.length) {
        setSelectedJobId(payload.jobs[0].id);
      }
    } catch (err) {
      setError(err.message || 'Job listesi alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, pageSize, statusFilter, selectedJobId]);

  const loadJobDetails = useCallback(async (jobId) => {
    if (!jobId) return;
    setDetailsLoading(true);
    try {
      const payload = await fetchJson(`/api/jobs/${jobId}`);
      setJobDetails(payload);
    } catch (err) {
      setJobDetails({ error: err.message });
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleJobAction = useCallback(async (action) => {
    if (!selectedJobId) return;
    setActionError(null);
    setActionLoading((prev) => ({ ...prev, [action]: true }));
    try {
      await fetchJson(`/api/jobs/${selectedJobId}/${action}`, { method: 'POST' });
      await loadJobs();
      await loadJobDetails(selectedJobId);
    } catch (err) {
      setActionError(err.message || 'İşlem başarısız.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [action]: false }));
    }
  }, [selectedJobId, loadJobs, loadJobDetails]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (selectedJobId && !jobs.find((job) => job.id === selectedJobId)) {
      setSelectedJobId(jobs[0]?.id || null);
    }
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetails(selectedJobId);
    }
  }, [selectedJobId, loadJobDetails]);

  const rows = useMemo(() => (
    jobs.map((job) => ({
      id: job.id,
      type: job.type || 'n/a',
      status: job.status || 'unknown',
      created: formatDate(job.created_at),
      updated: formatDate(job.updated_at),
    }))
  ), [jobs]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || null;
  const events = jobDetails?.events || [];
  const canRetry = selectedJob?.status === 'failed';
  const canCancel = selectedJob?.status === 'queued' || selectedJob?.status === 'processing';

  if (!isAuthenticated) {
    return (
      <div className="workspace-panel">
        <Tile className="workspace-panel__empty">
          <h3>İş Geçmişi</h3>
          <p>Job geçmişini görmek için giriş yapın.</p>
        </Tile>
      </div>
    );
  }

  return (
    <div className="workspace-panel jobs-panel">
      <div className="workspace-panel__header">
        <div>
          <h2>Jobs & Activity</h2>
          <p>Son işlerin durumunu ve loglarını takip edin.</p>
        </div>
        <Button kind="secondary" size="sm" renderIcon={Renew} onClick={loadJobs}>
          Yenile
        </Button>
      </div>

      <div className="jobs-panel__filters">
        <Dropdown
          id="jobs-status-filter"
          items={statusOptions}
          label="Durum"
          selectedItem={statusFilter}
          onChange={({ selectedItem }) => {
            setStatusFilter(selectedItem || statusOptions[0]);
            setPage(1);
          }}
        />
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Hata"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
        />
      )}

      {loading ? (
        <div className="workspace-panel__loading">
          <InlineLoading description="Job listesi yükleniyor" />
        </div>
      ) : jobs.length === 0 ? (
        <Tile className="workspace-panel__empty">
          <WarningAlt size={32} />
          <h3>Job kaydı bulunamadı</h3>
          <p>Yeni bir dönüşüm başlattığınızda burada görünecek.</p>
        </Tile>
      ) : (
        <div className="jobs-panel__content">
          <div className="jobs-panel__table">
            <DataTable rows={rows} headers={headers}>
              {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                <Table {...getTableProps()} size="lg">
                  <TableHead>
                    <TableRow>
                      {tableHeaders.map((header) => (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow
                        {...getRowProps({ row })}
                        key={row.id}
                        className={row.id === selectedJobId ? 'jobs-panel__row--active' : ''}
                        onClick={() => setSelectedJobId(row.id)}
                      >
                        {row.cells.map((cell) => {
                          if (cell.info.header === 'status') {
                            const statusMeta = mapStatusTag(cell.value);
                            return (
                              <TableCell key={cell.id}>
                                <Tag type={statusMeta.type}>{statusMeta.label}</Tag>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          </div>

          <div className="jobs-panel__details">
            <div className="jobs-panel__details-header">
              <h3>Job Detayı</h3>
              {selectedJob && (
                <Tag type={mapStatusTag(selectedJob.status).type}>
                  {mapStatusTag(selectedJob.status).label}
                </Tag>
              )}
            </div>

            {detailsLoading ? (
              <InlineLoading description="Job detayları yükleniyor" />
            ) : jobDetails?.error ? (
              <InlineNotification kind="error" title="Hata" subtitle={jobDetails.error} />
            ) : selectedJob ? (
              <>
                <div className="jobs-panel__meta">
                  <div><strong>Job ID:</strong> {selectedJob.id}</div>
                  <div><strong>Tip:</strong> {selectedJob.type}</div>
                  <div><strong>Başlangıç:</strong> {formatDate(selectedJob.created_at)}</div>
                  <div><strong>Güncelleme:</strong> {formatDate(selectedJob.updated_at)}</div>
                </div>

                <div className="jobs-panel__actions">
                  <Button
                    kind="secondary"
                    size="sm"
                    disabled={!canRetry || actionLoading.retry}
                    onClick={() => handleJobAction('retry')}
                  >
                    {actionLoading.retry ? 'Retry...' : 'Retry'}
                  </Button>
                  <Button
                    kind="tertiary"
                    size="sm"
                    disabled={!canCancel || actionLoading.cancel}
                    onClick={() => handleJobAction('cancel')}
                  >
                    {actionLoading.cancel ? 'Cancel...' : 'Cancel'}
                  </Button>
                </div>

                {actionError && (
                  <InlineNotification
                    kind="error"
                    title="İşlem Hatası"
                    subtitle={actionError}
                    lowContrast
                  />
                )}

                <div className="jobs-panel__timeline">
                  <h4>Timeline</h4>
                  {events.length === 0 ? (
                    <p>Henüz event yok.</p>
                  ) : (
                    <ul>
                      {events.map((event, index) => (
                        <li key={event.id || `${event.status}-${event.created_at}-${index}`}>
                          <span className="jobs-panel__event-status">{event.status}</span>
                          <div>
                            <strong>{event.stage || event.message || 'Event'}</strong>
                            {event.progress != null && (
                              <span className="jobs-panel__event-progress">%{event.progress}</span>
                            )}
                            <div className="jobs-panel__event-time">{formatDate(event.created_at)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="jobs-panel__logs">
                  <h4>Loglar</h4>
                  {events.length === 0 ? (
                    <p>Log kaydı yok.</p>
                  ) : (
                    <div className="jobs-panel__log-list">
                      {events.map((event, index) => (
                        <div key={`${event.id || 'event'}-log-${index}`} className="jobs-panel__log-entry">
                          <span className="jobs-panel__log-time">{formatDate(event.created_at)}</span>
                          <span>{event.message || event.stage || event.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p>Bir job seçin.</p>
            )}
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="workspace-panel__pagination">
          <Pagination
            page={page}
            pageSize={pageSize}
            pageSizes={pageSizes}
            totalItems={total}
            onChange={({ page: nextPage, pageSize: nextSize }) => {
              if (nextSize !== pageSize) {
                setPageSize(nextSize);
                setPage(1);
              } else {
                setPage(nextPage);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
