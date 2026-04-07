import { Outlet, NavLink } from 'react-router-dom'

const Layout = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⚽ 足球经理</h1>
      </header>
      
      <nav className="nav-tabs">
        <NavLink to="/home" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          🏠 首页
        </NavLink>
        <NavLink to="/squad" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          👥 球队
        </NavLink>
        <NavLink to="/training" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          🏋 训练
        </NavLink>
        <NavLink to="/transfer" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          🔄 转会
        </NavLink>
        <NavLink to="/finance" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          💰 财务
        </NavLink>
        <NavLink to="/youth" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          🎓 青训
        </NavLink>
        <NavLink to="/coaches" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          👨‍🏫 教练
        </NavLink>
        <NavLink to="/social" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          👥 社交
        </NavLink>
        <NavLink to="/match" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          ⚽ 比赛
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          👤 我的
        </NavLink>
      </nav>
      
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
