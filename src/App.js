import { Layout, Menu } from 'antd';
import BulkUpdate from './components/BulkUpdate';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="title">工具库</div>
      </Header>
      <Content>
        <Layout className="site-layout-background">
          <Sider className="site-layout-background" width={200} style={{ height: '883px' }}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%' }}
            >
              <Menu.Item key="1">批量更新依赖</Menu.Item>
            </Menu>
          </Sider>
          <Content style={{ padding: '24px', minHeight: 280, backgroundColor: '#eee' }}>
            <main style={{ padding: '24px', height: '100%', backgroundColor: '#fff' }}>
              <BulkUpdate />
            </main>
          </Content>
        </Layout>
      </Content>
      </Layout>
  );
}

export default App;
