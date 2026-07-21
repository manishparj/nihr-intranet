import { useState } from 'react';
import { Layout, Menu, Button, Space, Tag, Drawer } from 'antd';
import { 
  UserOutlined, TeamOutlined, StarOutlined, PrinterOutlined, 
  CustomerServiceOutlined, HomeOutlined, MenuOutlined, LoginOutlined, 
  LogoutOutlined, BulbOutlined, BulbFilled, AppstoreOutlined, 
  ProjectOutlined, SolutionOutlined, FilePdfOutlined, CalendarOutlined, 
  SettingOutlined, KeyOutlined, SafetyCertificateOutlined, NotificationOutlined
} from '@ant-design/icons';
import { VisibilityConfig } from '../../types';

const { Header } = Layout;

interface AppHeaderProps {
  currentKey: string;
  setCurrentKey: (key: string) => void;
  isAuthenticated: boolean;
  currentAdmin: any;
  handleLogout: () => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  visibility: VisibilityConfig | null;
  setShowLoginModal: (show: boolean) => void;
  loadCaptcha: () => void;
}

export function AppHeader({
  currentKey,
  setCurrentKey,
  isAuthenticated,
  currentAdmin,
  handleLogout,
  themeMode,
  setThemeMode,
  visibility,
  setShowLoginModal,
  loadCaptcha
}: AppHeaderProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Generate Menu items dynamically based on auth and visibility
  const getPublicMenuItems = () => {
    return [
      { key: 'public-dashboard', icon: <HomeOutlined />, label: 'Notice Board' },
      ...(visibility?.modules.scientists ? [{ key: 'public-scientists', icon: <UserOutlined />, label: 'Scientists' }] : []),
      ...(visibility?.modules.projects ? [{ key: 'public-projects', icon: <ProjectOutlined />, label: 'Projects Ledger' }] : []),
      ...(visibility?.modules.projectStaff ? [{ key: 'public-pstaff', icon: <SolutionOutlined />, label: 'Project Staff' }] : []),
      // ...(visibility?.modules.permanentStaff ? [{ key: 'public-permanent', icon: <TeamOutlined />, label: 'Permanent Staff' }] : []),
      ...(visibility?.modules.ypConsultants ? [{ key: 'public-ypc', icon: <StarOutlined />, label: 'YP & Consultants' }] : []),
      { key: 'public-salary-portal', icon: <PrinterOutlined />, label: 'Salary Portal' },
      { key: 'outsourcing', icon: <SafetyCertificateOutlined />, label: 'Outsourced & Agencies' },
      { key: 'complaints', icon: <CustomerServiceOutlined />, label: 'Complaints Desk' }
    ];
  };

  const getAdminMenuItems = () => {
    return [
      { key: 'admin-dashboard', icon: <AppstoreOutlined />, label: 'Admin Dashboard' },
      {
        key: 'registries',
        icon: <TeamOutlined />,
        label: 'Registries',
        children: [
          { key: 'admin-scientists', icon: <UserOutlined />, label: 'Scientists Registry' },
          { key: 'admin-projects', icon: <ProjectOutlined />, label: 'Projects Ledger' },
          { key: 'admin-project-staff', icon: <SolutionOutlined />, label: 'Project Staff' },
          // { key: 'admin-permanent-staff', icon: <TeamOutlined />, label: 'Permanent Staff' },
          { key: 'admin-yp-consultants', icon: <StarOutlined />, label: 'YP & Consultants' },
          { key: 'admin-salaries', icon: <PrinterOutlined />, label: 'Staff Salaries' },
          { key: 'outsourcing', icon: <SafetyCertificateOutlined />, label: 'Outsourced & Agencies' }
        ]
      },
      {
        key: 'library',
        icon: <FilePdfOutlined />,
        label: 'Library',
        children: [
          { key: 'admin-circulars', icon: <FilePdfOutlined />, label: 'Office Circulars' },
          { key: 'admin-forms', icon: <FilePdfOutlined />, label: 'Office Forms' },
          { key: 'admin-events', icon: <CalendarOutlined />, label: 'Seminars & Events' },
          { key: 'admin-tickers', icon: <NotificationOutlined />, label: 'Board Tickers' }
        ]
      },
      { key: 'admin-visibility', icon: <SettingOutlined />, label: 'Visibility' },
      { key: 'complaints', icon: <CustomerServiceOutlined />, label: 'Complaints Desk' },
      ...(currentAdmin?.id === 'admin-1' ? [{ key: 'admin-accounts', icon: <KeyOutlined />, label: 'Admin Accounts' }] : []),
      { key: 'public-dashboard', icon: <HomeOutlined />, label: 'View Public' }
    ];
  };

  const menuItems = isAuthenticated ? getAdminMenuItems() : getPublicMenuItems();

  const handleMenuClick = ({ key }: { key: string }) => {
    setCurrentKey(key);
    setDrawerVisible(false);
  };

  return (
    <>
      {/* 1. BLACK BRAND HEADER HEADER */}
      <Header className="bg-slate-950 dark:bg-black text-white px-4 md:px-8 flex justify-between items-center sticky top-0 z-50 h-16 shadow-md border-b border-slate-900 select-none">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 hover:bg-white/20 transition-all rounded-xl flex items-center justify-center overflow-hidden font-bold text-white text-xs shadow-inner flex-shrink-0 border border-white/10 p-1" style={{ height: '10%', width: '25%' }}>
            <img 
              src="https://niirncd.icmr.org.in/assets/img/logo/nihrlogo.png" 
              alt="Logo" 
              className="w-full h-full object-contain filter brightness-110" 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
            />
            
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-sm md:text-base font-black tracking-tight text-white m-0 flex items-center gap-1.5">
              <span className="italic font-sans text-blue-400">NIHR</span> Intranet <span className="text-blue-400 font-semibold text-xs md:text-sm">| Project & Staff Ledger</span>
            </h1>
            {isAuthenticated ? (
              <span className="text-[9px] font-extrabold uppercase text-emerald-400 tracking-wider">Super Admin Session</span>
            ) : (
              <span className="text-[9px] font-semibold text-slate-400 tracking-wider">National Institute of Health Research</span>
            )}
          </div>
        </div>

        {/* Desktop Header Actions (Right) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle Button */}
          <Button 
            type="text" 
            icon={themeMode === 'dark' ? <BulbFilled className="text-yellow-400 text-base" /> : <BulbOutlined className="text-slate-300 text-base" />} 
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
            className="text-white hover:bg-white/10 rounded-lg flex items-center justify-center w-9 h-9 border-0"
          />

          {/* Auth / Admin Control */}
          {!isAuthenticated ? (
            <Button 
              type="primary" 
              icon={<LoginOutlined />} 
              className="rounded-lg text-xs font-bold bg-[#005EB8] hover:bg-blue-600 border-0 h-9 px-4 shadow-sm"
              onClick={() => { setShowLoginModal(true); loadCaptcha(); }}
            >
              Admin Login
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Tag color="blue" className="m-0 border-0 text-xs px-3 py-1.5 font-extrabold uppercase tracking-wider flex items-center gap-1.5 rounded-lg bg-blue-950/50 text-blue-300 shadow-sm border border-blue-900/40">
                <UserOutlined /> {currentAdmin?.name}
              </Tag>
              <Button 
                danger 
                type="text"
                icon={<LogoutOutlined />} 
                className="rounded-lg text-xs font-bold flex items-center justify-center text-slate-300 hover:text-white hover:bg-red-950/40 h-9"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Actions Menu & Drawer Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button 
            type="text" 
            icon={themeMode === 'dark' ? <BulbFilled className="text-yellow-400 text-base" /> : <BulbOutlined className="text-slate-300 text-base" />} 
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
            className="text-white hover:bg-white/10 flex items-center justify-center w-9 h-9"
          />
          <Button 
            type="text" 
            icon={<MenuOutlined className="text-slate-200 text-base" />} 
            onClick={() => setDrawerVisible(true)}
            className="text-white hover:bg-white/10 flex items-center justify-center w-9 h-9"
          />
        </div>
      </Header>

      {/* 2. SUB-HEADER HORIZONTAL TABS BAR */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200/80 dark:border-zinc-800/80 sticky top-16 z-40 shadow-sm select-none">
        <div className="max-w-10xl mx-auto px-4 md:px-8 overflow-x-auto scrollbar-none flex items-center justify-start md:justify-center">
          <Menu
            mode="horizontal"
            selectedKeys={[currentKey]}
            onClick={handleMenuClick}
            items={menuItems}
            className="border-b-0 w-full bg-transparent dark:bg-transparent font-bold text-xs text-slate-700 dark:text-zinc-200 flex justify-start md:justify-center whitespace-nowrap min-w-max"
            style={{ borderBottom: 'none', height: '46px', lineHeight: '46px' }}
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="Intranet Navigation"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{
          body: { padding: 0 },
          wrapper: { width: 280 }
        }}
        className="dark:bg-zinc-900"
      >
        <div className="flex flex-col h-full justify-between p-4 dark:bg-zinc-900">
          <div className="space-y-4">
            {isAuthenticated && (
              <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-800 rounded-xl mb-4">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Logged in Admin</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 block">{currentAdmin?.name}</span>
              </div>
            )}
            <Menu
              mode="vertical"
              selectedKeys={[currentKey]}
              onClick={handleMenuClick}
              items={menuItems}
              className="border-r-0 font-semibold bg-transparent"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            {!isAuthenticated ? (
              <Button 
                type="primary" 
                block
                icon={<LoginOutlined />} 
                className="rounded-lg text-xs font-bold bg-[#005EB8]"
                onClick={() => { setDrawerVisible(false); setShowLoginModal(true); loadCaptcha(); }}
              >
                Super Admin Login
              </Button>
            ) : (
              <Button 
                danger 
                block
                icon={<LogoutOutlined />} 
                className="rounded-lg text-xs font-bold"
                onClick={() => { setDrawerVisible(false); handleLogout(); }}
              >
                Logout Account
              </Button>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
}
