
import React, { useState, useEffect } from 'react';
import { Page, DestinationHub } from './types';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import TicketReissue from './pages/TicketReissue';
import FleetManagement from './pages/FleetManagement';
import UserManagement from './pages/UserManagement';
import FlightSearch from './pages/FlightSearch';
import FlightResults from './pages/FlightResults';
import FareClassSelection from './pages/FareClassSelection';
import PassengerDetails from './pages/PassengerDetails';
import SeatSelection from './pages/SeatSelection';
import PaymentProcessing from './pages/PaymentProcessing';
import TicketConfirmation from './pages/TicketConfirmation';
import FlightScheduling from './pages/FlightScheduling';
import GateAssignment from './pages/GateAssignment';
import ManageDelay from './pages/ManageDelay';
import DisruptionResolution from './pages/DisruptionResolution';
import RegulatoryManifest from './pages/RegulatoryManifest';
import SeatMapCMS from './pages/SeatMapCMS';
import AircraftSwap from './pages/AircraftSwap';
import OperationalTriggers from './pages/OperationalTriggers';
import AlertAuditLog from './pages/AlertAuditLog';
import MFASettings from './pages/MFASettings';
import SSOSettings from './pages/SSOSettings';
import PasswordPolicy from './pages/PasswordPolicy';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CreateNewPassword from './pages/CreateNewPassword';
import ResetSuccessful from './pages/ResetSuccessful';
import EmailTemplatesCMS from './pages/EmailTemplatesCMS';
import EmailAuditLog from './pages/EmailAuditLog';
import SMSConfiguration from './pages/SMSConfiguration';
import SMSAuditLog from './pages/SMSAuditLog';
import BookingDetail from './pages/BookingDetail';
import ModifyBookingSearch from './pages/ModifyBookingSearch';
import NotificationPreferences from './pages/NotificationPreferences';
import AccountSettings from './pages/AccountSettings';
import ReviewFlightChange from './pages/ReviewFlightChange';
import FlightChangeSuccess from './pages/FlightChangeSuccess';
import MenuManagement from './pages/MenuManagement';
import HeaderManagement from './pages/HeaderManagement';
import ExperimentsDashboard from './pages/ExperimentsDashboard';
import ExperimentsAuditLog from './pages/ExperimentsAuditLog';
import PageEditor from './pages/PageEditor';
import FooterManagement from './pages/FooterManagement';
import FaviconSEOAuditLog from './pages/FaviconSEOAuditLog';
import SessionMonitor from './pages/SessionMonitor';
import SessionAuditLog from './pages/SessionAuditLog';
import LandingHome from './pages/LandingHome';
import CheckinRetrieval from './pages/CheckinRetrieval';
import CheckinPassengers from './pages/CheckinPassengers';
import CheckinDeclaration from './pages/CheckinDeclaration';
import CheckinSeats from './pages/CheckinSeats';
import CheckinSuccess from './pages/CheckinSuccess';
import ManageBookingRetrieval from './pages/ManageBookingRetrieval';
import FlightTrackerSearch from './pages/FlightTrackerSearch';
import FlightTrackerResults from './pages/FlightTrackerResults';
import Destinations from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [activePage, setActivePage] = useState<Page>(Page.HOME_LANDING);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningType, setScanningType] = useState<'REGISTRY' | 'TELEMETRY'>('REGISTRY');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authPage, setAuthPage] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'NEW_PASSWORD' | 'SUCCESS'>('LOGIN');
  const [selectedDestination, setSelectedDestination] = useState<DestinationHub | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowAuthFlow(false);
    setActivePage(Page.DASHBOARD);
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage(Page.HOME_LANDING);
  };

  const navigateTo = (page: Page) => {
    setActivePage(page);
    setIsMobileMenuOpen(false); 
    window.scrollTo(0, 0);
  };

  const startBookingScan = () => {
    setScanningType('REGISTRY');
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      navigateTo(Page.BOOKING_RESULTS);
    }, 2500);
  };

  const startCheckinScan = () => {
    setScanningType('REGISTRY');
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      navigateTo(Page.CHECKIN_PASSENGERS);
    }, 2000);
  };

  const startManageScan = () => {
    setScanningType('REGISTRY');
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      navigateTo(Page.BOOKING_DETAIL);
    }, 1800);
  };

  const startTrackerScan = () => {
    setScanningType('TELEMETRY');
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      navigateTo(Page.FLIGHT_TRACKER_RESULTS);
    }, 2200);
  };

  const handleSelectDestination = (dest: DestinationHub) => {
    setSelectedDestination(dest);
    navigateTo(Page.DESTINATION_DETAIL);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case Page.HOME_LANDING: 
        return (
          <LandingHome 
            onBookingStart={startBookingScan} 
            onCheckinStart={() => navigateTo(Page.CHECKIN_RETRIEVAL)} 
            onManageBookingStart={() => navigateTo(Page.MANAGE_BOOKING_RETRIEVAL)}
            onFlightStatusStart={() => navigateTo(Page.FLIGHT_TRACKER_SEARCH)}
            onDestinationsStart={() => navigateTo(Page.DESTINATIONS)}
            onAdminAccess={() => setShowAuthFlow(true)} 
            onNavigate={navigateTo}
          />
        );
      case Page.DASHBOARD: return <Dashboard onNavigate={navigateTo} />;
      case Page.BOOKINGS: return <Bookings onNavigate={navigateTo} />;
      case Page.REISSUE: return <TicketReissue />;
      case Page.FLEET: return <FleetManagement />;
      case Page.USER_MGMT: return <UserManagement />;
      case Page.SCHEDULING: return <FlightScheduling />;
      case Page.GATE_CONTROL: return <GateAssignment />;
      case Page.MANAGE_DELAY: return <ManageDelay />;
      case Page.DISRUPTION_RESOLUTION: return <DisruptionResolution />;
      case Page.REGULATORY_MANIFEST: return <RegulatoryManifest />;
      case Page.SEAT_MAP_CMS: return <SeatMapCMS />;
      case Page.AIRCRAFT_SWAP: return <AircraftSwap />;
      case Page.OPERATIONAL_TRIGGERS: return <OperationalTriggers />;
      case Page.ALERT_AUDIT_LOG: return <AlertAuditLog />;
      case Page.MFA_CONFIG: return <MFASettings />;
      case Page.SSO_CONFIG: return <SSOSettings />;
      case Page.PASSWORD_POLICY: return <PasswordPolicy />;
      case Page.SESSION_MONITOR: return <SessionMonitor />;
      case Page.SESSION_AUDIT_LOG: return <SessionAuditLog />;
      case Page.EMAIL_CMS: return <EmailTemplatesCMS onOpenLog={() => navigateTo(Page.EMAIL_AUDIT_LOG)} />;
      case Page.EMAIL_AUDIT_LOG: return <EmailAuditLog />;
      case Page.SMS_CMS: return <SMSConfiguration onOpenLog={() => navigateTo(Page.SMS_AUDIT_LOG)} />;
      case Page.SMS_AUDIT_LOG: return <SMSAuditLog />;
      
      case Page.BOOKING_DETAIL: return <BookingDetail onNavigate={navigateTo} />;
      case Page.MODIFY_BOOKING: return <ModifyBookingSearch onNavigate={navigateTo} />;
      case Page.REVIEW_FLIGHT_CHANGE: return <ReviewFlightChange onNavigate={navigateTo} />;
      case Page.FLIGHT_CHANGE_SUCCESS: return <FlightChangeSuccess onNavigate={navigateTo} />;
      case Page.NOTIFICATION_PREFS: return <NotificationPreferences />;
      case Page.ACCOUNT_SETTINGS: return <AccountSettings onNavigate={navigateTo} />;
      case Page.MENU_MGMT: return <MenuManagement />;
      case Page.HEADER_MGMT: return <HeaderManagement />;
      case Page.PAGE_EDITOR: return <PageEditor />;
      case Page.FOOTER_MGMT: return <FooterManagement />;
      case Page.FAVICON_SEO_LOG: return <FaviconSEOAuditLog />;

      case Page.EXPERIMENTS_DASHBOARD: return <ExperimentsDashboard onNavigate={navigateTo} />;
      case Page.EXPERIMENTS_AUDIT_LOG: return <ExperimentsAuditLog onNavigate={navigateTo} />;

      case Page.BOOKING_SEARCH: return <FlightSearch onNext={startBookingScan} />;
      case Page.BOOKING_RESULTS: return <FlightResults onBack={() => navigateTo(Page.HOME_LANDING)} onNext={() => navigateTo(Page.BOOKING_FARE)} />;
      case Page.BOOKING_FARE: return <FareClassSelection onBack={() => navigateTo(Page.BOOKING_RESULTS)} onNext={() => navigateTo(Page.BOOKING_PASSENGERS)} />;
      case Page.BOOKING_PASSENGERS: return <PassengerDetails onBack={() => navigateTo(Page.BOOKING_FARE)} onNext={() => navigateTo(Page.BOOKING_SEATS)} />;
      case Page.BOOKING_SEATS: return <SeatSelection onBack={() => navigateTo(Page.BOOKING_PASSENGERS)} onNext={() => navigateTo(Page.BOOKING_PAYMENT)} />;
      case Page.BOOKING_PAYMENT: return <PaymentProcessing onBack={() => navigateTo(Page.BOOKING_SEATS)} onNext={() => navigateTo(Page.BOOKING_CONFIRMATION)} />;
      case Page.BOOKING_CONFIRMATION: return <TicketConfirmation onDone={() => navigateTo(Page.HOME_LANDING)} />;

      case Page.CHECKIN_RETRIEVAL: return <CheckinRetrieval onNext={startCheckinScan} onBack={() => navigateTo(Page.HOME_LANDING)} />;
      case Page.CHECKIN_PASSENGERS: return <CheckinPassengers onNext={() => navigateTo(Page.CHECKIN_DECLARATION)} onBack={() => navigateTo(Page.CHECKIN_RETRIEVAL)} />;
      case Page.CHECKIN_DECLARATION: return <CheckinDeclaration onNext={() => navigateTo(Page.CHECKIN_SEATS)} onBack={() => navigateTo(Page.CHECKIN_PASSENGERS)} />;
      case Page.CHECKIN_SEATS: return <CheckinSeats onNext={() => navigateTo(Page.CHECKIN_SUCCESS)} onBack={() => navigateTo(Page.CHECKIN_DECLARATION)} />;
      case Page.CHECKIN_SUCCESS: return <CheckinSuccess onDone={() => navigateTo(Page.HOME_LANDING)} />;

      case Page.MANAGE_BOOKING_RETRIEVAL: return <ManageBookingRetrieval onNext={startManageScan} onBack={() => navigateTo(Page.HOME_LANDING)} />;

      case Page.FLIGHT_TRACKER_SEARCH: return <FlightTrackerSearch onNext={startTrackerScan} onBack={() => navigateTo(Page.HOME_LANDING)} />;
      case Page.FLIGHT_TRACKER_RESULTS: return <FlightTrackerResults onBack={() => navigateTo(Page.FLIGHT_TRACKER_SEARCH)} />;

      case Page.DESTINATIONS: return <Destinations onBack={() => navigateTo(Page.HOME_LANDING)} onBookStart={startBookingScan} onSelectDestination={handleSelectDestination} />;
      case Page.DESTINATION_DETAIL: return selectedDestination ? <DestinationDetail destination={selectedDestination} onBack={() => navigateTo(Page.DESTINATIONS)} onBookNow={startBookingScan} /> : null;
      
      default: return <LandingHome onBookingStart={startBookingScan} onCheckinStart={() => navigateTo(Page.CHECKIN_RETRIEVAL)} onManageBookingStart={() => navigateTo(Page.MANAGE_BOOKING_RETRIEVAL)} onFlightStatusStart={() => navigateTo(Page.FLIGHT_TRACKER_SEARCH)} onDestinationsStart={() => navigateTo(Page.DESTINATIONS)} onAdminAccess={() => setShowAuthFlow(true)} onNavigate={navigateTo} />;
    }
  };

  if (isScanning) {
    return (
      <div className="fixed inset-0 bg-navy-950 z-[100] flex flex-col items-center justify-center text-white font-display overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] border-2 border-primary rounded-full animate-ping"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] border border-primary rounded-full animate-pulse"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-12 text-center">
           <div className="size-32 rounded-3xl bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(19,127,236,0.4)] animate-in zoom-in duration-1000">
             <span className={`material-symbols-outlined !text-6xl font-black text-white animate-spin`}>
                {scanningType === 'REGISTRY' ? 'airlines' : 'satellite_alt'}
             </span>
           </div>
           
           <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter uppercase">
                 {scanningType === 'REGISTRY' ? 'Querying Registry Hub' : 'Linking Fleet Telemetry'}
              </h2>
              <div className="flex items-center gap-3 justify-center">
                 <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-fast shadow-[0_0_15px_rgba(19,127,236,0.8)]"></div>
                 </div>
              </div>
              <div className="flex flex-col gap-1 opacity-40 font-mono text-[9px] uppercase tracking-widest">
                 <p>Connecting: GLOBAL-CORE-NYC-01</p>
                 <p>{scanningType === 'REGISTRY' ? 'Optimizing flight sequence vectors...' : 'Retrieving transponder logic nodes...'}</p>
                 <p>Retrieving real-time fleet telemetry...</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && showAuthFlow) {
    switch (authPage) {
      case 'REGISTER':
        return <Register onRegister={() => setAuthPage('LOGIN')} onGoToLogin={() => setAuthPage('LOGIN')} />;
      case 'FORGOT':
        return <ForgotPassword onSendReset={() => setAuthPage('NEW_PASSWORD')} onBackToLogin={() => setAuthPage('LOGIN')} />;
      case 'NEW_PASSWORD':
        return <CreateNewPassword onResetComplete={() => setAuthPage('SUCCESS')} onBackToLogin={() => setAuthPage('LOGIN')} />;
      case 'SUCCESS':
        return <ResetSuccessful onGoToLogin={() => setAuthPage('LOGIN')} />;
      default:
        return (
          <div className="relative min-h-screen">
             <button 
               onClick={() => setShowAuthFlow(false)}
               className="fixed top-8 left-8 z-50 flex items-center gap-2 px-4 py-2 bg-white border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-all shadow-sm"
             >
                <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Site
             </button>
             <Login onLogin={handleLogin} onGoToRegister={() => setAuthPage('REGISTER')} onGoToForgot={() => setAuthPage('FORGOT')} />
          </div>
        );
    }
  }

  if (isLoggedIn) {
    const navGroups = [
      {
        title: 'Storefront',
        items: [
          { id: Page.HOME_LANDING, label: 'Public Home', icon: 'home' },
          { id: Page.BOOKING_RESULTS, label: 'Search Results', icon: 'travel_explore' },
        ]
      },
      {
        title: 'Core Operations',
        items: [
          { id: Page.DASHBOARD, label: 'Ops Dashboard', icon: 'dashboard' },
          { id: Page.SCHEDULING, label: 'Scheduling', icon: 'calendar_month' },
          { id: Page.FLEET, label: 'Assignments', icon: 'connecting_airports' },
        ]
      },
      {
        title: 'User Hub',
        items: [
          { id: Page.BOOKINGS, label: 'Reservations', icon: 'confirmation_number' },
          { id: Page.ACCOUNT_SETTINGS, label: 'Profile', icon: 'person' },
        ]
      },
      {
        title: 'Content CMS',
        items: [
          { id: Page.PAGE_EDITOR, label: 'Page Builder', icon: 'article' },
          { id: Page.HEADER_MGMT, label: 'Header', icon: 'view_quilt' },
          { id: Page.FAVICON_SEO_LOG, label: 'Branding & SEO', icon: 'travel_explore' },
        ]
      },
      {
        title: 'Security',
        items: [
          { id: Page.SESSION_MONITOR, label: 'Monitor', icon: 'verified_user' },
          { id: Page.PASSWORD_POLICY, label: 'Policy', icon: 'lock_reset' },
        ]
      }
    ];

    return (
      <div className="flex h-screen w-full bg-navy-50 overflow-hidden font-sans text-navy-950">
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-navy-100 flex flex-col transition-all duration-300 shadow-xl lg:shadow-none shrink-0`}>
          <div className="p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2 flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-2xl font-bold">airlines</span>
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <div className="flex flex-col overflow-hidden">
                  <h1 className="text-base font-extrabold leading-none tracking-tight text-navy-950 truncate uppercase">Deltablue</h1>
                  <p className="text-navy-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ops Center</p>
                </div>
              )}
            </div>
            <button className="lg:hidden text-navy-400" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto custom-scrollbar">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx}>
                <p className={`px-3 text-[10px] font-black text-navy-300 uppercase tracking-[0.2em] mb-3 transition-opacity ${(isSidebarOpen || isMobileMenuOpen) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all group ${
                        activePage === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-400 hover:bg-navy-50 hover:text-primary'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${activePage === item.id ? 'filled' : ''}`}>{item.icon}</span>
                      {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-bold truncate">{item.label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-navy-100">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-navy-50 rounded-xl transition-colors" onClick={() => navigateTo(Page.ACCOUNT_SETTINGS)}>
                <div className="size-10 rounded-full bg-navy-100 bg-center bg-cover border-2 border-white shadow-sm shrink-0" style={{ backgroundImage: 'url(https://picsum.photos/100/100)' }} />
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-navy-900 truncate">Marcus Chen</span>
                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest truncate">System Admin</span>
                  </div>
                )}
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm">
                  <span className="material-symbols-outlined">logout</span> Sign Out
                </button>
              )}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="h-16 bg-white border-b border-navy-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:block p-1 text-navy-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">menu</span>
              </button>
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1 text-navy-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="text-sm md:text-lg font-extrabold text-navy-950 tracking-tight whitespace-nowrap uppercase">Deltablue Hub</h2>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                 <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Sync
              </div>
              <button className="p-2 text-navy-400 hover:text-primary relative transition-colors"><span className="material-symbols-outlined">public</span></button>
              <button className="p-2 text-navy-400 hover:text-primary relative transition-colors"><span className="material-symbols-outlined">notifications</span></button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-navy-50 custom-scrollbar">
            {renderActivePage()}
          </main>
        </div>
      </div>
    );
  }

  const isPublicFlow = [
    Page.BOOKING_RESULTS,
    Page.BOOKING_FARE,
    Page.BOOKING_PASSENGERS,
    Page.BOOKING_SEATS,
    Page.BOOKING_PAYMENT,
    Page.BOOKING_CONFIRMATION,
    Page.CHECKIN_RETRIEVAL,
    Page.CHECKIN_PASSENGERS,
    Page.CHECKIN_DECLARATION,
    Page.CHECKIN_SEATS,
    Page.CHECKIN_SUCCESS,
    Page.MANAGE_BOOKING_RETRIEVAL,
    Page.BOOKING_DETAIL,
    Page.MODIFY_BOOKING,
    Page.REVIEW_FLIGHT_CHANGE,
    Page.FLIGHT_CHANGE_SUCCESS,
    Page.FLIGHT_TRACKER_SEARCH,
    Page.FLIGHT_TRACKER_RESULTS,
    Page.DESTINATIONS,
    Page.DESTINATION_DETAIL,
    Page.ACCOUNT_SETTINGS
  ].includes(activePage);

  if (isPublicFlow) {
    return (
      <div className="min-h-screen bg-navy-50 flex flex-col">
        <header className="bg-white border-b border-navy-100 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-12">
            <div 
              onClick={() => navigateTo(Page.HOME_LANDING)}
              className="flex items-center gap-3 font-black text-2xl tracking-tighter text-navy-950 uppercase cursor-pointer"
            >
              <div className="size-8 bg-primary rounded-tr-lg rounded-bl-lg shadow-lg shadow-primary/20" />
              Deltablue<span className="text-primary">Air</span>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigateTo(Page.DESTINATIONS)}
                className={`hidden sm:block text-[10px] font-black uppercase tracking-widest hover:text-primary ${activePage === Page.DESTINATIONS ? 'text-primary' : 'text-navy-400'}`}
              >
                Destinations
              </button>
              <button 
                onClick={() => navigateTo(Page.FLIGHT_TRACKER_SEARCH)}
                className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary"
              >
                Flight Status
              </button>
              <button 
                onClick={() => navigateTo(Page.CHECKIN_RETRIEVAL)}
                className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary"
              >
                Check-in
              </button>
              <button 
                onClick={() => navigateTo(Page.MANAGE_BOOKING_RETRIEVAL)}
                className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary"
              >
                My Trips
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigateTo(Page.ACCOUNT_SETTINGS)}
              className="bg-primary text-white text-[10px] font-black px-6 py-2.5 rounded-xl uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">account_circle</span>
              My Account
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-navy-50 custom-scrollbar">
          {renderActivePage()}
        </main>
      </div>
    );
  }

  return (
    <LandingHome 
      onBookingStart={startBookingScan} 
      onCheckinStart={() => navigateTo(Page.CHECKIN_RETRIEVAL)}
      onManageBookingStart={() => navigateTo(Page.MANAGE_BOOKING_RETRIEVAL)}
      onFlightStatusStart={() => navigateTo(Page.FLIGHT_TRACKER_SEARCH)}
      onDestinationsStart={() => navigateTo(Page.DESTINATIONS)}
      onAdminAccess={() => setShowAuthFlow(true)} 
      onNavigate={navigateTo}
    />
  );
};

export default App;
