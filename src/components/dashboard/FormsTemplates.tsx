import { Card, Input, Empty, Avatar, Button, Pagination } from 'antd';
import { SearchOutlined, SolutionOutlined, DownloadOutlined } from '@ant-design/icons';
import { FormDocument } from '../../types';

interface FormsTemplatesProps {
  filteredForms: FormDocument[];
  paginatedForms: FormDocument[];
  formSearchText: string;
  setFormSearchText: (val: string) => void;
  formPage: number;
  setFormPage: (val: number) => void;
  handleDownloadBase64File: (fileName: string, base64: string) => void;
  visible: boolean;
}

export function FormsTemplates({
  filteredForms,
  paginatedForms,
  formSearchText,
  setFormSearchText,
  formPage,
  setFormPage,
  handleDownloadBase64File,
  visible
}: FormsTemplatesProps) {
  if (!visible) return null;

  return (
    <Card 
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 py-1">
          <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            📝 OFFICE FORMS & TEMPLATES
          </span>
          <Input
            placeholder="Search forms..."
            size="small"
            prefix={<SearchOutlined className="text-slate-400" />}
            value={formSearchText}
            onChange={(e) => { setFormSearchText(e.target.value); setFormPage(1); }}
            style={{ width: '180px' }}
            className="rounded-lg text-xs"
            allowClear
          />
        </div>
      }
      variant="outlined"
      className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden animate-fadeIn"
      styles={{ body: { flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' } }}
    >
      <div className="flex-1 space-y-3 min-h-[300px]">
        {paginatedForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Empty description="No matching forms found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          paginatedForms.map((item, index) => (
            <div key={item.id || index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 rounded-lg gap-3 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar icon={<SolutionOutlined />} size="small" className="bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 leading-snug line-clamp-2">{item.title}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Published: {item.uploadDate}</div>
                </div>
              </div>
              <Button 
                type="primary" 
                size="small"
                className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-md shadow-none flex items-center justify-center"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadBase64File(item.fileName, item.fileData)}
              >
                Download
              </Button>
            </div>
          ))
        )}
      </div>
      {filteredForms.length > 5 && (
        <div className="mt-4 flex justify-end border-t border-slate-100 dark:border-zinc-800 pt-3">
          <Pagination 
            size="small" 
            current={formPage} 
            total={filteredForms.length} 
            pageSize={5} 
            onChange={(page) => setFormPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </Card>
  );
}
