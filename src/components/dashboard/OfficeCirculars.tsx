import { Card, Input, Empty, Avatar, Button, Pagination } from 'antd';
import { SearchOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { Circular } from '../../types';

interface OfficeCircularsProps {
  filteredCirculars: Circular[];
  paginatedCirculars: Circular[];
  circularSearchText: string;
  setCircularSearchText: (val: string) => void;
  circularPage: number;
  setCircularPage: (val: number) => void;
  handleDownloadBase64File: (fileName: string, base64: string) => void;
  visible: boolean;
}

export function OfficeCirculars({
  filteredCirculars,
  paginatedCirculars,
  circularSearchText,
  setCircularSearchText,
  circularPage,
  setCircularPage,
  handleDownloadBase64File,
  visible,
}: OfficeCircularsProps) {
  if (!visible) return null;

  return (
    <Card
      title={
        <div className="flex flex-col gap-2 py-1.5 w-full">
          <span className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 shrink-0 bg-emerald-500 rounded-full animate-pulse" />
            <span className="truncate">Institutional Office Circulars</span>
          </span>
          <Input
            placeholder="Search circulars…"
            size="small"
            prefix={<SearchOutlined className="text-slate-400" />}
            value={circularSearchText}
            onChange={(e) => {
              setCircularSearchText(e.target.value);
              setCircularPage(1);
            }}
            className="rounded-lg text-xs w-full"
            allowClear
          />
        </div>
      }
      variant="outlined"
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden"
      styles={{ body: { flex: 1, padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0 } }}
    >
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[60vh] sm:max-h-[420px]">
        {paginatedCirculars.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Empty description="No matching circulars found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          paginatedCirculars.map((item, index) => (
            <div
              key={item.id || index}
              className="flex flex-col xs:flex-row sm:flex-row items-start sm:items-center justify-between gap-2.5 border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:shadow-sm hover:border-slate-200 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                <Avatar
                  icon={<FilePdfOutlined />}
                  size="small"
                  className="bg-red-50 dark:bg-red-950/40 text-red-500 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 leading-snug line-clamp-2">
                    {item.title}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    Published: {item.uploadDate}
                  </div>
                </div>
              </div>
              <Button
                type="primary"
                size="small"
                className="w-full sm:w-auto shrink-0 text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-md shadow-none flex items-center justify-center gap-1"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadBase64File(item.fileName, item.fileData)}
              >
                View Doc
              </Button>
            </div>
          ))
        )}
      </div>
      {filteredCirculars.length > 5 && (
        <div className="flex justify-center sm:justify-end border-t border-slate-100 dark:border-zinc-800 px-3 sm:px-4 py-2.5">
          <Pagination
            size="small"
            current={circularPage}
            total={filteredCirculars.length}
            pageSize={5}
            onChange={(page) => setCircularPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </Card>
  );
}