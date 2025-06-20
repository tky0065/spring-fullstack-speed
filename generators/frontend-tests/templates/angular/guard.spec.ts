import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { <%= guardName %>Guard } from './<%= guardName.toLowerCase() %>.guard';
import { AuthService } from '../services/auth.service';

describe('<%= guardName %>Guard', () => {
  let guard: <%= guardName %>Guard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = { url: '/protected' } as RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        <%= guardName %>Guard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(<%= guardName %>Guard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = guard.canActivate(dummyRoute, dummyState);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = guard.canActivate(dummyRoute, dummyState);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/protected' }
    });
  });

  it('should allow access when user has required role', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.hasRole.and.returnValue(true);

    // Assume the guard checks for 'ADMIN' role for this route
    dummyRoute.data = { roles: ['ADMIN'] };

    const result = guard.canActivate(dummyRoute, dummyState);

    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to unauthorized when user does not have required role', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.hasRole.and.returnValue(false);

    // Assume the guard checks for 'ADMIN' role for this route
    dummyRoute.data = { roles: ['ADMIN'] };

    const result = guard.canActivate(dummyRoute, dummyState);

    expect(result).toBe(false);
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });
});
