import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { <%= serviceName %>Service } from './<%= serviceName.toLowerCase() %>.service';

describe('<%= serviceName %>Service', () => {
  let service: <%= serviceName %>Service;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [<%= serviceName %>Service]
    });

    service = TestBed.inject(<%= serviceName %>Service);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Après chaque test, vérifier qu'il n'y a pas de requêtes HTTP en attente
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all users', () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];

    service.getAll().subscribe(users => {
      expect(users).toBeTruthy();
      expect(users.length).toBe(2);
      expect(users[0].name).toBe('John Doe');
    });

    const req = httpTestingController.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should get a user by ID', () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };

    service.getById(1).subscribe(user => {
      expect(user).toBeTruthy();
      expect(user.id).toBe(1);
      expect(user.name).toBe('John Doe');
    });

    const req = httpTestingController.expectOne('/api/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should create a new user', () => {
    const newUser = { name: 'New User', email: 'new@example.com' };
    const createdUser = { id: 3, name: 'New User', email: 'new@example.com' };

    service.create(newUser).subscribe(user => {
      expect(user).toBeTruthy();
      expect(user.id).toBe(3);
      expect(user.name).toBe('New User');
    });

    const req = httpTestingController.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(createdUser);
  });

  it('should update a user', () => {
    const updatedUser = { id: 1, name: 'Updated Name', email: 'updated@example.com' };

    service.update(updatedUser).subscribe(user => {
      expect(user).toBeTruthy();
      expect(user.id).toBe(1);
      expect(user.name).toBe('Updated Name');
    });

    const req = httpTestingController.expectOne('/api/users/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedUser);
    req.flush(updatedUser);
  });

  it('should delete a user', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpTestingController.expectOne('/api/users/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should handle errors', () => {
    const errorMessage = 'Server error';

    service.getAll().subscribe({
      next: () => fail('Expected an error, not users'),
      error: error => {
        expect(error.status).toBe(500);
        expect(error.error).toBe(errorMessage);
      }
    });

    const req = httpTestingController.expectOne('/api/users');
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });
});
