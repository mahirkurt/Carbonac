import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DataTable,
  Dropdown,
  InlineLoading,
  InlineNotification,
  Pagination,
  Search,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tile,
} from '@carbon/react';
import { DocumentPdf, Edit, Renew } from '@carbon/icons-react';

import { useAuth, useDocument, WORKFLOW_STEPS } from '../../contexts';
import { documentService } from '../../services/documentService';
import { useStaggerAnimation } from '../../hooks';

const headers = [
  { key: 'title', header: 'Başlık' },
  { key: 'status', header: 'Durum' },
  { key: 'updated', header: 'Güncellendi' },
  { key: 'actions', header: 'Aksiyon' },
];

const statusOptions = [
  { id: 'all', label: 'Tümü' },
  { id: 'draft', label: 'Taslak' },
  { id: 'processing', label: 'İşleniyor' },
  { id: 'ready', label: 'Hazır' },
  { id: 'error', label: 'Hata' },
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
    case 'ready':
      return { type: 'green', label: 'Hazır' };
    case 'processing':
      return { type: 'blue', label: 'İşleniyor' };
    case 'error':
      return { type: 'red', label: 'Hata' };
    default:
      return { type: 'gray', label: status || 'Taslak' };
  }
}

export default function DocumentsPanel({ onOpenDocument, onStartWorkflow }) {
  const { user, isAuthenticated } = useAuth();
  const { setStep } = useDocument();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadDocuments = useCallback(async () => {
    const userId = user?.id || user?.userId || user?.uid;
    if (!isAuthenticated || !userId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { documents: data, error: fetchError } = await documentService.getDocuments(userId, {
        limit: 200,
      });
      if (fetchError) {
        throw new Error(fetchError.message || 'Dokümanlar getirilemedi.');
      }
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Dokümanlar getirilemedi.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesStatus = statusFilter?.id === 'all' || doc.status === statusFilter?.id;
      if (!matchesStatus) return false;
      if (!query) return true;
      const title = (doc.title || doc.original_filename || '').toLowerCase();
      return title.includes(query);
    });
  }, [documents, search, statusFilter]);

  const pagedDocuments = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredDocuments.slice(startIndex, startIndex + pageSize);
  }, [filteredDocuments, page, pageSize]);

  const rows = useMemo(() => (
    pagedDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title || doc.original_filename || 'Untitled',
      status: doc.status || 'draft',
      updated: formatDate(doc.updated_at || doc.created_at),
      actions: doc.id,
    }))
  ), [pagedDocuments]);

  const { getItemProps: getStaggerProps } = useStaggerAnimation({
    itemCount: rows.length,
    baseDelay: 30,
    staggerDelay: 30,
    triggerOnMount: true,
  });

  const totalItems = filteredDocuments.length;

  const handleOpen = useCallback((docId) => {
    const doc = documents.find((item) => item.id === docId);
    if (!doc) return;
    if (typeof onOpenDocument === 'function') {
      onOpenDocument(doc);
      return;
    }
    setStep(WORKFLOW_STEPS.EDITOR);
  }, [documents, onOpenDocument, setStep]);

  if (!isAuthenticated) {
    return (
      <div className="workspace-panel">
        <Tile className="workspace-panel__empty">
          <h3>Dokümanlar</h3>
          <p>Doküman listenizi görmek için giriş yapın.</p>
        </Tile>
      </div>
    );
  }

  return (
    <div className="workspace-panel documents-panel">
      <div className="workspace-panel__header">
        <div>
          <h2>Dokümanlarım</h2>
          <p>Yüklenen dokümanları yönet ve düzenle.</p>
        </div>
        <Button kind="secondary" size="sm" renderIcon={Renew} onClick={loadDocuments}>
          Yenile
        </Button>
      </div>

      <div className="documents-panel__filters">
        <Search
          labelText="Doküman ara"
          placeholder="Başlığa göre ara"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Dropdown
          id="document-status-filter"
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
          <InlineLoading description="Dokümanlar yükleniyor" />
        </div>
      ) : totalItems === 0 ? (
        <Tile className="workspace-panel__empty">
          <DocumentPdf size={32} />
          <h3>Henüz doküman yok</h3>
          <p>Yeni bir doküman yükleyerek başlayabilirsiniz.</p>
          <Button
            kind="primary"
            onClick={() => {
              if (typeof onStartWorkflow === 'function') {
                onStartWorkflow();
                return;
              }
              setStep(WORKFLOW_STEPS.UPLOAD);
            }}
          >
            Doküman Yükle
          </Button>
        </Tile>
      ) : (
        <DataTable rows={rows} headers={headers}>
          {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
            <Table {...getTableProps()} size="lg" className="documents-panel__table">
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
                {tableRows.map((row, idx) => (
                  <TableRow {...getRowProps({ row })} key={row.id} style={getStaggerProps(idx).style}>
                    {row.cells.map((cell) => {
                      if (cell.info.header === 'status') {
                        const statusMeta = mapStatusTag(cell.value);
                        return (
                          <TableCell key={cell.id}>
                            <Tag type={statusMeta.type}>{statusMeta.label}</Tag>
                          </TableCell>
                        );
                      }
                      if (cell.info.header === 'actions') {
                        return (
                          <TableCell key={cell.id}>
                            <div className="documents-panel__actions">
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Edit}
                                onClick={() => handleOpen(row.id)}
                              >
                                Aç
                              </Button>
                            </div>
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
      )}

      {totalItems > 0 && (
        <div className="workspace-panel__pagination">
          <Pagination
            page={page}
            pageSize={pageSize}
            pageSizes={pageSizes}
            totalItems={totalItems}
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
