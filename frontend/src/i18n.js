import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Branding & Headings
      appName: 'Smart Lock',
      homeAutomation: 'Home Automation',
      securityHub: 'Security Hub',
      subtitle: 'Door status and access control',
      mainEntrance: 'Main Entrance',
      nodeLabel: 'Main Door Lock • Living Room',
      
      // Connection & States
      brokerActive: 'Lock Connected',
      brokerConnecting: 'Connecting to lock...',
      portalStatus: 'Physical Portal',
      doorOpened: 'Door Opened',
      doorClosed: 'Door Closed',
      doorOpenDesc: 'Sensor detects open frame',
      doorClosedDesc: 'Latch magnet engaged',
      lockerStatus: 'Locker Status',
      active: 'Active',
      locked: 'Locked',
      securedAndClosed: 'Secured & Closed',
      unlockedAndOpen: 'Unlocked & Open',
      
      // Dial & Actions
      openDoor: 'OPEN DOOR',
      sending: 'SENDING...',
      systemLocked: 'SYSTEM LOCKED',
      doorOpenAction: 'DOOR OPEN',
      tapToUnlock: 'Tap to unlock',
      unlockToEnable: 'Unlock system first',
      autoLockingSoon: 'Auto-locking soon',
      
      // Emergency Lockdown
      emergencyAlert: 'EMERGENCY LOCKDOWN ENGAGED',
      emergencyAlertDesc: 'Keypad and key cards are temporarily disabled.',
      liftLockdown: 'Lift Lockdown',
      systemProtection: 'System Protection',
      lockdownActive: 'Lockdown Active',
      normalGuard: 'Normal Guard',
      sensorsArmed: 'Sensors Armed',
      sensorsDisabled: 'Sensors Disabled',
      keypadRfid: 'Keypad & key cards',
      lockdownBtn: 'Lockdown',
      restoreBtn: 'Restore',
      
      // Stats
      weeklyTrends: 'Weekly Unlock Trends',
      totalUnlocks: 'total',
      
      // Navigation
      navDashboard: 'Dashboard',
      navFaces: 'AI Faces',
      navSecurity: 'Security',
      navHistory: 'Access History',
      navRfid: 'Key Cards',
      navSettings: 'Settings',
      logout: 'Sign Out',
      
      // Access History
      recentActivity: 'Recent Access Logs',
      allLogsTitle: 'Access History Log',
      allLogsSubtitle: 'Door activity, key card access, and remote commands',
      searchPlaceholder: 'Search by activity or card number...',
      filterAll: 'All Events',
      filterRfid: 'Key Cards Only',
      filterApp: 'Remote / App',
      filterSecurity: 'Security Alerts',
      refreshLogs: 'Refresh',
      exportCsv: 'Export CSV',
      noLogsFound: 'No access logs recorded yet.',
      tableAction: 'Action / Event',
      tableRfid: 'Card Number',
      tableTime: 'Timestamp',
      tableMethod: 'Method',
      
      // RFID Management
      rfidTitle: 'Key Card Management',
      rfidSubtitle: 'Manage authorized physical tags, guest access cards, and test swipes',
      addNewCard: 'Add New Key Card',
      cardHolderName: 'Cardholder Name',
      cardUid: 'Card number (e.g., C30B2407)',
      cardRole: 'Access Permission',
      addCardBtn: 'Register Card',
      testSwipe: 'Simulate Swipe',
      swipeSuccess: 'Key card accepted: Door unlocked!',
      cardActive: 'Active',
      cardBlocked: 'Blocked',
      noCardsFound: 'No registered key cards.',
      
      // Security Tab
      securityCenterTitle: 'Security Command Center',
      securityCenterSubtitle: 'Monitor peripheral sensors, active lockdowns, and intrusion detection',
      reedSwitchSensor: 'Magnetic Door Sensor',
      
      tamperSwitch: 'Anti-Tamper Enclosure',
      keypadLockout: 'Keypad / Key Card Lockout',
      sensorNormal: 'Normal / Armed',
      sensorTripped: 'Tripped / Open',
      emergencyActionTitle: 'Emergency Lockdown Switch',
      emergencyActionDesc: 'Temporarily stop door access from the keypad and key cards.',
      testBuzzer: 'Test Alarm Sound',
      buzzerTriggered: 'Alarm sound test sent.',
      
      // Settings Tab
      systemConfigTitle: 'System & Device Configuration',
      systemConfigSubtitle: 'Manage the door password and connection status',
      mqttBrokerInfo: 'Connection Status',
      statusTopicLabel: 'Activity Status',
      controlTopicLabel: 'Remote Control',
      databaseStatus: 'Database Connection',
      connected: 'Connected',
      disconnected: 'Disconnected',
      changePin: 'Change Master PIN',
      newPinPlaceholder: 'New 4-8 digit PIN',
      confirmPinPlaceholder: 'Confirm new PIN',
      updatePinBtn: 'Update PIN',
      dangerZone: 'System Danger Zone',
      clearAllLogs: 'Clear Access Logs',
      logsClearedSuccess: 'Access logs cleared.',

      // Profile Modal
      userProfile: 'User Profile',
      administrator: 'Administrator',
      systemRole: 'Role',
      currentSession: 'Active Session',
      validJwt: 'Verified JWT Session',
      confirmLogout: 'Are you sure you want to sign out?',
      cancel: 'Cancel',

      // Auth
      welcomeBack: 'Welcome Back',
      loginSubtitle: 'Enter your credentials to manage your smart lock system',
      createAccount: 'Create an Account',
      registerSubtitle: 'Register a new administrator or family account',
      username: 'Username',
      usernamePlaceholder: 'Enter your username',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter your password',
      signInBtn: 'Sign In to Dashboard',
      signUpBtn: 'Create Account',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      registerNow: 'Register now',
      loginNow: 'Sign in here',
    },
  },
  vi: {
    translation: {
      // Branding & Headings
      appName: 'Khóa Thông Minh',
      homeAutomation: 'Nhà Thông Minh',
      securityHub: 'Bảng Điều Khiển Khóa Cửa',
      subtitle: 'Theo dõi trạng thái cửa và quản lý quyền truy cập',
      mainEntrance: 'Lối Vào Chính',
      nodeLabel: 'Khóa Cửa Chính • Phòng Khách',
      
      // Connection & States
      brokerActive: 'Khóa Đang Kết Nối',
      brokerConnecting: 'Đang kết nối với khóa...',
      portalStatus: 'Trạng Thái Cửa',
      doorOpened: 'Cửa Đang Mở',
      doorClosed: 'Cửa Đang Đóng',
      doorOpenDesc: 'Cảm biến nhận diện khung cửa mở',
      doorClosedDesc: 'Chốt khóa nam châm an toàn',
      lockerStatus: 'Trạng Thái Chốt',
      active: 'Hoạt Động',
      locked: 'Đã Khóa',
      securedAndClosed: 'An Toàn & Đã Đóng',
      unlockedAndOpen: 'Đã Mở Chốt & Mở Cửa',
      
      // Dial & Actions
      openDoor: 'MỞ CỬA',
      sending: 'ĐANG GỬI...',
      systemLocked: 'HỆ THỐNG ĐÃ KHÓA',
      doorOpenAction: 'CỬA ĐANG MỞ',
      tapToUnlock: 'Chạm để mở khóa',
      unlockToEnable: 'Mở khóa hệ thống trước',
      autoLockingSoon: 'Sắp tự động khóa',
      
      // Emergency Lockdown
      emergencyAlert: 'KHÓA HỆ THỐNG ĐANG BẬT',
      emergencyAlertDesc: 'Bàn phím và thẻ từ đang tạm ngừng hoạt động.',
      liftLockdown: 'Mở Quyền Truy Cập',
      systemProtection: 'Bảo Vệ Hệ Thống',
      lockdownActive: 'Đang Bị Khóa',
      normalGuard: 'Chế Độ Chuẩn',
      sensorsArmed: 'Cảm Biến Sẵn Sàng',
      sensorsDisabled: 'Cảm Biến Đã Tắt',
      keypadRfid: 'Bàn phím & thẻ từ',
      lockdownBtn: 'Chặn Thao Tác',
      restoreBtn: 'Khôi Phục',
      
      // Stats
      weeklyTrends: 'Xu Hướng Mở Cửa Trong Tuần',
      totalUnlocks: 'tổng lượt',
      
      // Navigation
      navDashboard: 'Bảng Điều Khiển',
      navFaces: 'Khuôn Mặt AI',
      navSecurity: 'Bảo Mật',
      navHistory: 'Lịch Sử Ra Vào',
      navRfid: 'Thẻ Từ & Chìa Khóa',
      navSettings: 'Cài Đặt',
      logout: 'Đăng Xuất',
      
      // Access History
      recentActivity: 'Lịch Sử Truy Cập',
      allLogsTitle: 'Nhật Ký Truy Cập Hệ Thống',
      allLogsSubtitle: 'Các lần mở cửa bằng bàn phím, thẻ từ hoặc ứng dụng',
      searchPlaceholder: 'Tìm kiếm theo hoạt động hoặc mã thẻ...',
      filterAll: 'Tất cả',
      filterRfid: 'Thẻ từ',
      filterApp: 'Từ xa / Web',
      filterSecurity: 'Cảnh báo bảo mật',
      refreshLogs: 'Làm Mới',
      exportCsv: 'Xuất CSV',
      noLogsFound: 'Chưa có nhật ký truy cập nào.',
      tableAction: 'Hành Động / Sự Kiện',
      tableRfid: 'Mã Thẻ',
      tableTime: 'Thời Gian',
      tableMethod: 'Phương Thức',
      
      // RFID Management
      rfidTitle: 'Quản Lý Thẻ Từ & Chìa Khóa',
      rfidSubtitle: 'Danh sách thẻ từ hợp lệ, cấp quyền mở cửa và mô phỏng quẹt thẻ',
      addNewCard: 'Thêm Thẻ Từ Mới',
      cardHolderName: 'Tên Chủ Thẻ',
      cardUid: 'Mã thẻ (ví dụ: C30B2407)',
      cardRole: 'Quyền Truy Cập',
      addCardBtn: 'Đăng Ký Thẻ',
      testSwipe: 'Quẹt Thẻ Thử',
      swipeSuccess: 'Đã dùng thẻ từ mở cửa thành công!',
      cardActive: 'Hoạt Động',
      cardBlocked: 'Đã Khóa',
      noCardsFound: 'Chưa có thẻ từ nào được đăng ký.',
      
      // Security Tab
      securityCenterTitle: 'Quản Lý Khóa Cửa',
      securityCenterSubtitle: 'Theo dõi trạng thái cửa và bảo vệ lối vào',
      reedSwitchSensor: 'Cảm Biến Cửa Từ Nam Châm',
      
      tamperSwitch: 'Cảm Biến Chống Cạy Phá',
      keypadLockout: 'Bàn phím / Thẻ từ',
      sensorNormal: 'Bình thường / Đang bật',
      sensorTripped: 'Bị tác động / Đang mở',
      emergencyActionTitle: 'Khóa Hệ Thống',
      emergencyActionDesc: 'Tạm ngừng mở cửa bằng bàn phím và thẻ từ để bảo vệ ngôi nhà.',
      testBuzzer: 'Kiểm Tra Còi Báo Động',
      buzzerTriggered: 'Đã gửi tín hiệu kiểm tra còi báo.',
      
      // Settings Tab
      systemConfigTitle: 'Cấu Hình Hệ Thống & Thiết Bị',
      systemConfigSubtitle: 'Quản lý mật khẩu mở cửa và trạng thái kết nối',
      mqttBrokerInfo: 'Trạng Thái Kết Nối',
      statusTopicLabel: 'Trạng Thái Hoạt Động',
      controlTopicLabel: 'Điều Khiển Từ Xa',
      databaseStatus: 'Trạng Thái Cơ Sở Dữ Liệu',
      connected: 'Đã Kết Nối',
      disconnected: 'Mất Kết Nối',
      changePin: 'Đổi Mật Khẩu Mở Cửa',
      newPinPlaceholder: 'Mật khẩu mới (4-8 số)',
      confirmPinPlaceholder: 'Nhập mật khẩu cũ',
      updatePinBtn: 'Lưu Mật Khẩu',
      dangerZone: 'Khu Vực Nguy Hiểm',
      clearAllLogs: 'Xóa Sạch Nhật Ký',
      logsClearedSuccess: 'Đã xóa danh sách nhật ký.',

      // Profile Modal
      userProfile: 'Hồ Sơ Người Dùng',
      administrator: 'Quản Trị Viên',
      systemRole: 'Vai Trò',
      currentSession: 'Phiên Đăng Nhập',
      validJwt: 'Token JWT Hợp Lệ',
      confirmLogout: 'Bạn có chắc chắn muốn đăng xuất?',
      cancel: 'Hủy Bỏ',

      // Auth
      welcomeBack: 'Chào Mừng Trở Lại',
      loginSubtitle: 'Đăng nhập để điều khiển và giám sát hệ thống khóa thông minh',
      createAccount: 'Đăng Ký Tài Khoản',
      registerSubtitle: 'Tạo tài khoản quản trị viên hoặc thành viên gia đình mới',
      username: 'Tên Đăng Nhập',
      usernamePlaceholder: 'Nhập tên tài khoản của bạn',
      password: 'Mật Khẩu',
      passwordPlaceholder: 'Nhập mật khẩu',
      confirmPassword: 'Xác Nhận Mật Khẩu',
      confirmPasswordPlaceholder: 'Nhập lại mật khẩu',
      signInBtn: 'Đăng Nhập Dashboard',
      signUpBtn: 'Tạo Tài Khoản',
      noAccount: 'Chưa có tài khoản?',
      haveAccount: 'Đã có tài khoản?',
      registerNow: 'Đăng ký ngay',
      loginNow: 'Đăng nhập tại đây',
    },
  },
};

const savedLanguage = localStorage.getItem('smartlock_lang') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
