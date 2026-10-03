import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Branding & Headings
      appName: 'ESP32 Smart Lock',
      homeAutomation: 'Home Automation',
      securityHub: 'Security Hub',
      subtitle: 'Real-time ESP32 telemetries & access control',
      mainEntrance: 'Main Entrance',
      nodeLabel: 'Smart ESP32 Lock • Living Room Node',
      
      // Connection & States
      brokerActive: 'HiveMQ Remote Active',
      brokerConnecting: 'Connecting to Broker...',
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
      emergencyAlertDesc: 'Keypad & RFID sensors disabled on ESP32 node.',
      liftLockdown: 'Lift Lockdown',
      systemProtection: 'System Protection',
      lockdownActive: 'Lockdown Active',
      normalGuard: 'Normal Guard',
      sensorsArmed: 'Sensors Armed',
      sensorsDisabled: 'Sensors Disabled',
      keypadRfid: 'Keypad & RFID',
      lockdownBtn: 'Lockdown',
      restoreBtn: 'Restore',
      
      // PIR Auto Mode Controls
      pirSettingsTitle: 'Smart Auto Mode (PIR Sensor)',
      pirModeToggle: 'PIR Motion Sensor Auto-Open',
      pirModeActive: 'Enabled: Detects approach to open door',
      pirModeInactive: 'Disabled: Manual RFID / Keypad only',
      autoCloseDelayLabel: 'Auto-Close Delay',
      secondsUnit: 'seconds',
      saveSettingsBtn: 'Save Sensor Config',
      settingsSavedSuccess: 'PIR Sensor configuration updated!',
      
      // Stats
      weeklyTrends: 'Weekly Unlock Trends',
      totalUnlocks: 'total',
      
      // Navigation
      navDashboard: 'Dashboard',
      navSecurity: 'Security',
      navHistory: 'Access History',
      navRfid: 'RFID & Keys',
      navSettings: 'Settings',
      logout: 'Sign Out',
      
      // Access History
      recentActivity: 'Recent Access Logs',
      allLogsTitle: 'Access History Log',
      allLogsSubtitle: 'Detailed record of all door events, RFID scans, and system commands',
      searchPlaceholder: 'Search by action or RFID UID...',
      filterAll: 'All Events',
      filterRfid: 'RFID Only',
      filterApp: 'Remote / App',
      filterSecurity: 'Security Alerts',
      refreshLogs: 'Refresh',
      exportCsv: 'Export CSV',
      noLogsFound: 'No access logs recorded yet.',
      tableAction: 'Action / Event',
      tableRfid: 'RFID UID',
      tableTime: 'Timestamp',
      tableMethod: 'Method',
      
      // RFID Management
      rfidTitle: 'RFID Cards & Key Management',
      rfidSubtitle: 'Manage authorized physical tags, guest access cards, and test swipes',
      addNewCard: 'Add New RFID Card',
      cardHolderName: 'Cardholder Name',
      cardUid: 'Card UID (e.g., C30B2407)',
      cardRole: 'Access Permission',
      addCardBtn: 'Register Card',
      testSwipe: 'Simulate Swipe',
      swipeSuccess: 'RFID card tapped: Door unlocked!',
      cardActive: 'Active',
      cardBlocked: 'Blocked',
      noCardsFound: 'No registered RFID cards.',
      
      // Security Tab
      securityCenterTitle: 'Security Command Center',
      securityCenterSubtitle: 'Monitor peripheral sensors, active lockdowns, and intrusion detection',
      reedSwitchSensor: 'Magnetic Door Sensor',
      pirMotionSensor: 'PIR Motion Detector',
      tamperSwitch: 'Anti-Tamper Enclosure',
      keypadLockout: 'Keypad / RFID Lockout',
      sensorNormal: 'Normal / Armed',
      sensorTripped: 'Tripped / Open',
      emergencyActionTitle: 'Emergency Lockdown Switch',
      emergencyActionDesc: 'Instantly cut off all physical door access from keypad and RFID tags.',
      testBuzzer: 'Test Alarm Buzzer',
      buzzerTriggered: 'ESP32 Buzzer test signal emitted!',
      
      // Settings Tab
      systemConfigTitle: 'System & Device Configuration',
      systemConfigSubtitle: 'Tune hardware parameters, MQTT broker endpoints, and security PINs',
      mqttBrokerInfo: 'MQTT Broker Endpoint',
      statusTopicLabel: 'Telemetry Status Topic',
      controlTopicLabel: 'Control Command Topic',
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
      appName: 'Khóa Thông Minh ESP32',
      homeAutomation: 'Nhà Thông Minh',
      securityHub: 'Trung Tâm Bảo Mật',
      subtitle: 'Đo từ xa & kiểm soát truy cập ESP32 thời gian thực',
      mainEntrance: 'Lối Vào Chính',
      nodeLabel: 'Khóa ESP32 Thông Minh • Cửa Chính Phòng Khách',
      
      // Connection & States
      brokerActive: 'HiveMQ Đang Kết Nối',
      brokerConnecting: 'Đang kết nối Broker...',
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
      emergencyAlert: 'ĐANG KÍCH HOẠT PHONG TỎA KHẨN CẤP',
      emergencyAlertDesc: 'Bàn phím PIN và đầu đọc RFID trên ESP32 đã bị vô hiệu hóa.',
      liftLockdown: 'Hủy Phong Tỏa',
      systemProtection: 'Bảo Vệ Hệ Thống',
      lockdownActive: 'Đang Phong Tỏa',
      normalGuard: 'Chế Độ Chuẩn',
      sensorsArmed: 'Cảm Biến Sẵn Sàng',
      sensorsDisabled: 'Cảm Biến Đã Tắt',
      keypadRfid: 'Bàn phím & RFID',
      lockdownBtn: 'Phong Tỏa',
      restoreBtn: 'Khôi Phục',
      
      // PIR Auto Mode Controls
      pirSettingsTitle: 'Chế Độ Tự Động (Cảm Biến PIR)',
      pirModeToggle: 'Cảm biến chuyển động PIR tự mở cửa',
      pirModeActive: 'Đang Bật: Tự mở khi phát hiện người lại gần',
      pirModeInactive: 'Đang Tắt: Chỉ mở bằng RFID / Mã PIN / Web',
      autoCloseDelayLabel: 'Thời Gian Trễ Tự Đóng',
      secondsUnit: 'giây',
      saveSettingsBtn: 'Lưu Cài Đặt Cảm Biến',
      settingsSavedSuccess: 'Cập nhật cấu hình cảm biến PIR thành công!',
      
      // Stats
      weeklyTrends: 'Xu Hướng Mở Cửa Trong Tuần',
      totalUnlocks: 'tổng lượt',
      
      // Navigation
      navDashboard: 'Bảng Điều Khiển',
      navSecurity: 'Bảo Mật',
      navHistory: 'Lịch Sử Ra Vào',
      navRfid: 'Thẻ RFID & Khóa',
      navSettings: 'Cài Đặt',
      logout: 'Đăng Xuất',
      
      // Access History
      recentActivity: 'Lịch Sử Truy Cập',
      allLogsTitle: 'Nhật Ký Truy Cập Hệ Thống',
      allLogsSubtitle: 'Bản ghi chi tiết các sự kiện mở cửa, quẹt thẻ RFID và lệnh từ xa',
      searchPlaceholder: 'Tìm kiếm theo hành động hoặc mã thẻ RFID...',
      filterAll: 'Tất cả',
      filterRfid: 'Thẻ RFID',
      filterApp: 'Từ xa / Web',
      filterSecurity: 'Cảnh báo bảo mật',
      refreshLogs: 'Làm Mới',
      exportCsv: 'Xuất CSV',
      noLogsFound: 'Chưa có nhật ký truy cập nào.',
      tableAction: 'Hành Động / Sự Kiện',
      tableRfid: 'Mã Thẻ RFID',
      tableTime: 'Thời Gian',
      tableMethod: 'Phương Thức',
      
      // RFID Management
      rfidTitle: 'Quản Lý Thẻ RFID & Chìa Khóa',
      rfidSubtitle: 'Danh sách thẻ từ hợp lệ, cấp quyền mở cửa và mô phỏng quẹt thẻ',
      addNewCard: 'Thêm Thẻ RFID Mới',
      cardHolderName: 'Tên Chủ Thẻ',
      cardUid: 'Mã Thẻ (UID, ví dụ: C30B2407)',
      cardRole: 'Quyền Truy Cập',
      addCardBtn: 'Đăng Ký Thẻ',
      testSwipe: 'Quẹt Thẻ Thử',
      swipeSuccess: 'Đã quẹt thẻ RFID: Cửa mở thành công!',
      cardActive: 'Hoạt Động',
      cardBlocked: 'Đã Khóa',
      noCardsFound: 'Chưa có thẻ RFID nào được đăng ký.',
      
      // Security Tab
      securityCenterTitle: 'Trung Tâm Chỉ Huy Bảo Mật',
      securityCenterSubtitle: 'Giám sát cảm biến ngoại vi, trạng thái phong tỏa và phát hiện đột nhập',
      reedSwitchSensor: 'Cảm Biến Cửa Từ Nam Châm',
      pirMotionSensor: 'Cảm Biến Chuyển Động PIR',
      tamperSwitch: 'Cảm Biến Chống Cạy Phá',
      keypadLockout: 'Khóa Bàn Phím / RFID',
      sensorNormal: 'Bình thường / Đang bật',
      sensorTripped: 'Bị tác động / Đang mở',
      emergencyActionTitle: 'Công Tắc Phong Tỏa Khẩn Cấp',
      emergencyActionDesc: 'Ngay lập tức vô hiệu hóa bàn phím số và thẻ RFID tại cửa để ngăn chặn đột nhập.',
      testBuzzer: 'Kiểm Tra Còi Báo Động',
      buzzerTriggered: 'Đã phát tín hiệu kiểm tra còi báo ESP32!',
      
      // Settings Tab
      systemConfigTitle: 'Cấu Hình Hệ Thống & Thiết Bị',
      systemConfigSubtitle: 'Điều chỉnh tham số phần cứng, MQTT broker và mật mã chủ',
      mqttBrokerInfo: 'Máy Chủ MQTT Broker',
      statusTopicLabel: 'Topic Trạng Thái',
      controlTopicLabel: 'Topic Điều Khiển',
      databaseStatus: 'Trạng Thái Cơ Sở Dữ Liệu',
      connected: 'Đã Kết Nối',
      disconnected: 'Mất Kết Nối',
      changePin: 'Đổi Mã PIN Bàn Phím',
      newPinPlaceholder: 'Mã PIN mới (4-8 số)',
      confirmPinPlaceholder: 'Xác nhận mã PIN',
      updatePinBtn: 'Cập Nhật PIN',
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
