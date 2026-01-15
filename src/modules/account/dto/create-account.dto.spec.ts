import { validate } from 'class-validator';
import { CreateAccountDto } from './create-account.dto';

describe('CreateAccountDto', () => {
  describe('name validation', () => {
    it('应该通过有效的账号名称', async () => {
      const dto = new CreateAccountDto();
      dto.name = '测试账号1';
      dto.cookie = 'webBuild=5.3.1;web_session=xxx;...';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该拒绝空名称', async () => {
      const dto = new CreateAccountDto();
      dto.name = '';
      dto.cookie = 'valid-cookie';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('应该拒绝undefined名称', async () => {
      const dto = new CreateAccountDto();
      dto.cookie = 'valid-cookie';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });
  });

  describe('cookie validation', () => {
    it('应该通过有效的Cookie', async () => {
      const dto = new CreateAccountDto();
      dto.name = '测试账号';
      dto.cookie = 'webBuild=5.3.1;web_session=YOUR_SESSION_TOKEN;';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该拒绝空Cookie', async () => {
      const dto = new CreateAccountDto();
      dto.name = '测试账号';
      dto.cookie = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('cookie');
    });

    it('应该拒绝短Cookie（长度<10）', async () => {
      const dto = new CreateAccountDto();
      dto.name = '测试账号';
      dto.cookie = 'short';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const cookieError = errors.find((e) => e.property === 'cookie');
      expect(cookieError).toBeDefined();
      expect(cookieError.constraints).toHaveProperty('minLength');
    });

    it('应该拒绝undefined的Cookie', async () => {
      const dto = new CreateAccountDto();
      dto.name = '测试账号';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const cookieError = errors.find((e) => e.property === 'cookie');
      expect(cookieError).toBeDefined();
    });
  });

  describe('complete validation', () => {
    it('应该通过完整有效的数据', async () => {
      const dto = new CreateAccountDto();
      dto.name = '测试账号1';
      dto.cookie =
        'webBuild=5.3.1;web_session=YOUR_SESSION_TOKEN;websectiga=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该拒绝两个字段都为空', async () => {
      const dto = new CreateAccountDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });
  });
});
