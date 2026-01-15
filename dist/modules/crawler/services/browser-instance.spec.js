"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const browser_instance_1 = require("./browser-instance");
const browser_status_enum_1 = require("../enums/browser-status.enum");
describe('BrowserInstance', () => {
    let instance;
    let mockMCP;
    beforeEach(() => {
        mockMCP = {
            navigate: jest.fn(),
            snapshot: jest.fn(),
            evaluate: jest.fn(),
        };
        instance = new browser_instance_1.BrowserInstance('test-id', mockMCP);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('应该正确初始化浏览器实例', () => {
            expect(instance).toBeDefined();
            expect(instance.id).toBe('test-id');
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.UNINITIALIZED);
        });
    });
    describe('launch', () => {
        it('应该成功启动浏览器', async () => {
            mockMCP.navigate.mockResolvedValue({ success: true });
            await instance.launch();
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.IDLE);
            expect(instance.isHealthy()).toBe(true);
            expect(mockMCP.navigate).toHaveBeenCalled();
        });
        it('启动失败时应该抛出异常并设置状态为ERROR', async () => {
            mockMCP.navigate.mockRejectedValue(new Error('启动失败'));
            await expect(instance.launch()).rejects.toThrow('启动失败');
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.ERROR);
        });
        it('不应该重复启动已启动的浏览器', async () => {
            mockMCP.navigate.mockResolvedValue({ success: true });
            await instance.launch();
            await instance.launch();
            expect(mockMCP.navigate).toHaveBeenCalledTimes(1);
        });
    });
    describe('setCookie', () => {
        it('应该成功设置Cookie', async () => {
            mockMCP.evaluate.mockResolvedValue({ success: true });
            const cookie = 'webBuild=5.3.1;web_session=xxx;';
            await instance.setCookie(cookie);
            expect(mockMCP.evaluate).toHaveBeenCalledWith(expect.objectContaining({
                function: expect.stringContaining('document.cookie'),
            }));
        });
        it('设置Cookie失败时应该抛出异常', async () => {
            mockMCP.evaluate.mockRejectedValue(new Error('设置Cookie失败'));
            await expect(instance.setCookie('test-cookie')).rejects.toThrow('设置Cookie失败');
        });
    });
    describe('navigate', () => {
        it('应该成功导航到URL', async () => {
            const url = 'https://www.xiaohongshu.com/explore/test-id';
            mockMCP.navigate.mockResolvedValue({ success: true });
            await instance.navigate(url);
            expect(mockMCP.navigate).toHaveBeenCalledWith({ url });
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.BUSY);
        });
        it('导航超时应该抛出异常', async () => {
            mockMCP.navigate.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100)));
            await expect(instance.navigate('http://test.com')).rejects.toThrow('timeout');
        });
        it('导航失败应该设置状态为ERROR', async () => {
            mockMCP.navigate.mockRejectedValue(new Error('导航失败'));
            await expect(instance.navigate('http://test.com')).rejects.toThrow();
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.ERROR);
        });
    });
    describe('getPageContent', () => {
        it('应该成功获取页面内容', async () => {
            const mockHtml = '<html><body>测试内容</body></html>';
            mockMCP.snapshot.mockResolvedValue({ html: mockHtml });
            const content = await instance.getPageContent();
            expect(content).toBe(mockHtml);
            expect(mockMCP.snapshot).toHaveBeenCalled();
        });
        it('获取页面内容失败应该抛出异常', async () => {
            mockMCP.snapshot.mockRejectedValue(new Error('获取失败'));
            await expect(instance.getPageContent()).rejects.toThrow('获取失败');
        });
    });
    describe('close', () => {
        it('应该成功关闭浏览器', async () => {
            await instance.close();
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.UNINITIALIZED);
        });
    });
    describe('isHealthy', () => {
        it('IDLE状态应该返回true', () => {
            instance.status = browser_status_enum_1.BrowserStatus.IDLE;
            expect(instance.isHealthy()).toBe(true);
        });
        it('BUSY状态应该返回true', () => {
            instance.status = browser_status_enum_1.BrowserStatus.BUSY;
            expect(instance.isHealthy()).toBe(true);
        });
        it('ERROR状态应该返回false', () => {
            instance.status = browser_status_enum_1.BrowserStatus.ERROR;
            expect(instance.isHealthy()).toBe(false);
        });
        it('UNINITIALIZED状态应该返回false', () => {
            instance.status = browser_status_enum_1.BrowserStatus.UNINITIALIZED;
            expect(instance.isHealthy()).toBe(false);
        });
    });
    describe('setIdle', () => {
        it('应该将状态设置为IDLE', () => {
            instance.status = browser_status_enum_1.BrowserStatus.BUSY;
            instance.setIdle();
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.IDLE);
        });
    });
    describe('setBusy', () => {
        it('应该将状态设置为BUSY', () => {
            instance.status = browser_status_enum_1.BrowserStatus.IDLE;
            instance.setBusy();
            expect(instance.status).toBe(browser_status_enum_1.BrowserStatus.BUSY);
        });
    });
});
//# sourceMappingURL=browser-instance.spec.js.map