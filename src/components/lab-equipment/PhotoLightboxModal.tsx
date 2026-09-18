import React from 'react';
import { Modal, Button } from 'antd';
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';

export interface PhotoLightboxModalProps {
  visible?: boolean;
  url?: string;
  title?: string;
  photoPreview?: { visible: boolean; url: string; title: string } | null;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  visible: propVisible,
  url: propUrl,
  title: propTitle,
  photoPreview,
  onClose
}) => {
  const isOpen = propVisible !== undefined ? propVisible : (photoPreview ? photoPreview.visible : false);
  const currentUrl = propUrl || photoPreview?.url || '';
  const currentTitle = propTitle || photoPreview?.title || 'Equipment Photograph';

  if (!isOpen || !currentUrl) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 900, top: 20 }}
      centered
      destroyOnHidden
      className="photo-lightbox-modal p-0 overflow-hidden rounded-2xl"
    >
      <div className="bg-slate-950 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        <div>
          <h4 className="text-base font-bold text-white mb-0 flex items-center gap-2">
            📸 {currentTitle}
          </h4>
          <span className="text-xs text-slate-400">High-Resolution Equipment Photograph Archive</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="small"
            className="rounded-lg bg-blue-600 hover:bg-blue-500"
            onClick={() => {
              const link = document.createElement('a');
              link.href = currentUrl;
              link.download = `${currentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_photo.jpg`;
              link.target = '_blank';
              link.click();
            }}
          >
            Download
          </Button>
          <Button
            type="text"
            icon={<CloseOutlined className="text-white hover:text-red-400" />}
            onClick={onClose}
          />
        </div>
      </div>
      <div className="bg-black flex items-center justify-center p-2 sm:p-6 min-h-[350px] max-h-[75vh] overflow-auto">
        <img
          src={currentUrl}
          alt={currentTitle}
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
        />
      </div>
    </Modal>
  );
};
