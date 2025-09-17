# UniNotesHub - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema & Data Flow](#database-schema--data-flow)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Authentication System](#authentication-system)
7. [File Storage System](#file-storage-system)
8. [API Documentation](#api-documentation)
9. [Code Structure Deep Dive](#code-structure-deep-dive)
10. [Development Workflow](#development-workflow)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Security Implementation](#security-implementation)

---

## Project Overview

UniNotesHub is a **production-ready web platform** designed for university students to upload, browse, and download Previous Year Question (PYQ) papers and study notes. Think of it as a "GitHub for academic resources" where students can contribute and access educational materials.

### Key Features
- **Document Management**: Upload and organize university papers/notes by institution hierarchy
- **Advanced Search**: Multi-level filtering by university, program, branch, semester, and subject
- **User Management**: Role-based access control (Student/Admin) with email verification
- **Moderation System**: Admin approval workflow for uploaded content
- **Analytics**: Download tracking, user activity monitoring, and content statistics
- **Bookmarking**: Save favorite papers for quick access
- **Reporting**: Community-driven content quality control

---

## Architecture Overview

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    Frontend         │    │      Backend        │    │     Database        │
│    React + Vite     │◄──►│   FastAPI + Python  │◄──►│    PostgreSQL       │
│                     │    │                     │    │                     │
│ - Zustand Store     │    │ - SQLAlchemy ORM    │    │ - User Management   │
│ - React Query       │    │ - Pydantic Schemas  │    │ - Papers/Notes      │
│ - React Router      │    │ - JWT Auth          │    │ - Taxonomy System   │
│ - Tailwind CSS      │    │ - Rate Limiting     │    │ - Activity Logs     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                         │                         
           │                         │                         
           │                ┌─────────────────────┐           
           │                │   File Storage      │           
           └────────────────┤   S3 Compatible     │           
                           │   (MinIO/AWS S3)     │           
                           └─────────────────────┘           

┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Redis           │    │      Docker         │    │   Infrastructure    │
│   Caching &         │    │   Containerization  │    │                     │
│ Rate Limiting       │    │                     │    │ - GitHub Actions    │
│                     │    │ - Development Env   │    │ - Monitoring        │
│                     │    │ - Production Ready  │    │ - CI/CD Pipeline    │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19.1.1 with Vite for fast development
- Zustand for state management (simpler than Redux)
- React Query for server state management and caching
- React Router DOM for client-side routing
- Tailwind CSS for utility-first styling
- React Hook Form for form validation
- React Hot Toast for notifications

**Backend:**
- FastAPI (Python) for high-performance API
- SQLAlchemy 2.0 for database operations
- Pydantic for data validation and serialization
- PostgreSQL for primary database
- Redis for caching and rate limiting
- JWT for stateless authentication
- Alembic for database migrations

**Infrastructure:**
- Docker & Docker Compose for development
- MinIO (S3-compatible) for file storage
- GitHub Actions for CI/CD
- Sentry for error monitoring
- Prometheus for metrics (production)

---

## Database Schema & Data Flow

### Core Entity Relationships

```
University
├── Programs (B.Tech, M.Tech, MBA)
    ├── Branches (CSE, ECE, Mechanical)
        ├── Semesters (1, 2, 3...)
            ├── Subjects (DBMS, OS, Networks)
                ├── Papers (Exam papers by year)
                └── Notes (Study materials)
```

### Database Tables Structure

#### User Management
```sql
-- Users table with role-based access
users: id, email, password_hash, role, is_email_verified, profile_data

-- Authentication tracking
audit_logs: action, user_id, ip_address, metadata, timestamp
```

#### Academic Taxonomy (Hierarchical Structure)
```sql
universities: id, name, slug, location
programs: id, university_id, name, duration_years
branches: id, program_id, name, code
semesters: id, branch_id, number
subjects: id, semester_id, name, code
```

#### Content Management
```sql
-- Papers and Notes with moderation
papers: id, title, subject_id, uploader_id, status, storage_key, metadata
notes: id, title, subject_id, uploader_id, status, storage_key, metadata

-- User interactions
bookmarks: user_id, paper_id/note_id
downloads: user_id, paper_id/note_id, timestamp, metadata
ratings: user_id, paper_id/note_id, rating (1-5)
reports: user_id, content_id, reason, status
```

#### Activity Tracking
```sql
user_activities: user_id, activity_type, paper_id/note_id, metadata, timestamp
notifications: user_id, title, message, type, is_read
```

### Data Flow Patterns

1. **Content Upload Flow:**
   ```
   User → Frontend Form → Backend Validation → File Storage → Database → Moderation Queue
   ```

2. **Search & Filter Flow:**
   ```
   User Query → Frontend State → API Request → Database Query → Cached Results → UI Update
   ```

3. **Authentication Flow:**
   ```
   Login Request → Backend Validation → JWT Token → Frontend State → Protected Routes
   ```

---

## Backend Architecture

### Project Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Environment configuration
│   ├── deps.py              # Dependency injection
│   ├── db/
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── session.py       # Database connection
│   │   └── base.py          # Base model class
│   ├── routers/             # API endpoints
│   │   ├── auth.py          # Authentication routes
│   │   ├── papers.py        # Papers CRUD operations
│   │   ├── taxonomy.py      # University hierarchy
│   │   └── ...
│   ├── schemas/             # Pydantic data models
│   │   ├── user.py          # User data validation
│   │   ├── paper.py         # Paper data validation
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── auth.py          # Authentication logic
│   │   ├── paper.py         # Paper operations
│   │   └── ...
│   └── utils/               # Helper functions
├── migrations/              # Database migrations
└── tests/                   # Test files
```

### Key Backend Concepts

#### 1. FastAPI Application Structure (`main.py`)
```python
# Application factory pattern
def create_application() -> FastAPI:
    app = FastAPI(
        title="UniNotesHub API",
        description="University question papers platform",
        docs_url="/docs" if development else None  # Security measure
    )
    
    # Middleware for CORS, rate limiting, logging
    configure_middleware(app)
    
    # Exception handlers for consistent error responses
    configure_exception_handlers(app)
    
    # Include all route modules
    configure_routes(app)
    
    return app
```

#### 2. Database Models (`db/models.py`)
The models use SQLAlchemy ORM with these key patterns:

```python
class Paper(Base):
    __tablename__ = "papers"
    
    # UUID primary keys for security
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    
    # Required fields with validation
    title = Column(String(500), nullable=False, index=True)
    subject_id = Column(UUID(), ForeignKey("subjects.id"), nullable=False)
    
    # File storage metadata
    storage_key = Column(String(500), nullable=False)  # S3 object key
    file_hash = Column(String(64), unique=True, index=True)  # Prevent duplicates
    
    # Moderation workflow
    status = Column(Enum(PaperStatus), default=PaperStatus.PENDING)
    
    # Statistics tracking
    download_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    
    # Relationships
    subject = relationship("Subject", back_populates="papers")
    uploader = relationship("User", back_populates="papers")
    downloads = relationship("Download", back_populates="paper")
```

#### 3. Service Layer Pattern
Business logic is separated from routes:

```python
class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    async def register_user(self, user_data: UserCreate) -> Tuple[User, str]:
        # Validate password strength
        # Check for existing users
        # Hash password
        # Create user record
        # Generate verification token
        # Send verification email
        # Log audit event
        pass
```

#### 4. Dependency Injection (`deps.py`)
FastAPI's dependency system provides clean separation:

```python
def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_email_verified:
        raise EmailNotVerifiedError()
    return current_user

def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise PermissionDeniedError()
    return current_user
```

#### 5. Error Handling
Consistent error responses across the API:

```python
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "details": exc.details,
            }
        }
    )
```

---

## Frontend Architecture

### Project Structure
```
frontend/src/
├── App.jsx                  # Main app component
├── main.jsx                # React entry point
├── router/
│   └── index.jsx           # React Router configuration
├── components/
│   ├── common/             # Reusable components
│   ├── forms/              # Form components
│   ├── layout/             # Header, Footer, Layout
│   ├── specialized/        # PaperCard, NoteCard
│   └── ui/                 # Button, Input, Modal
├── pages/                  # Route components
│   ├── auth/               # Login, Register, etc.
│   ├── papers/             # Paper-related pages
│   ├── admin/              # Admin dashboard
│   └── user/               # User profile, settings
├── stores/                 # Zustand state management
│   ├── authStore.js        # Authentication state
│   ├── papersStore.js      # Papers data & operations
│   └── ...
├── lib/
│   └── api.js              # API client functions
└── hooks/                  # Custom React hooks
```

### State Management with Zustand

Zustand provides a simple, Redux-like store without boilerplate:

```javascript
// authStore.js - Authentication state management
const useAuthStore = create(
  persist(  // Persists to localStorage
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      accessToken: null,
      
      // Actions
      login: async (credentials) => {
        const response = await authAPI.login(credentials);
        set({
          user: response.user,
          isAuthenticated: true,
          accessToken: response.access_token,
        });
      },
      
      logout: async () => {
        await authAPI.logout();
        localStorage.removeItem('access_token');
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
        });
        window.location.href = '/';
      }
    })
  )
);
```

### React Router Configuration

```javascript
// Hierarchical routing with authentication guards
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'papers', element: <Papers /> },
      { path: 'papers/:id', element: <PaperDetail /> },
    ]
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Layout>
    ),
  },
  // Admin routes with role-based protection
  {
    path: '/admin',
    element: (
      <Layout>
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Layout>
    ),
  }
]);
```

### Component Architecture Patterns

#### 1. Higher-Order Components (HOCs) for Route Protection
```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuthStore();
  
  if (!isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};
```

#### 2. Custom Hooks for API Integration
```javascript
// usePapers.js - Custom hook for papers data
const usePapers = () => {
  const { 
    papers, 
    isLoading, 
    fetchPapers, 
    searchPapers 
  } = usePapersStore();
  
  return {
    papers,
    isLoading,
    fetchPapers,
    searchPapers,
    // Add more derived state and actions
  };
};
```

### UI Component System

The project uses a component-based design with Tailwind CSS:

```javascript
// Button component with variants
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = "font-medium rounded-lg transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  
  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size]
  );
  
  return <button className={classes} {...props}>{children}</button>;
};
```

---

## Authentication System

### JWT-Based Authentication Flow

```
1. User Registration:
   Frontend Form → Backend Validation → Password Hash → Database → Verification Email

2. Email Verification:
   Email Link → Backend Token Validation → User Status Update → Success Response

3. User Login:
   Credentials → Backend Validation → JWT Tokens → Frontend Storage → Protected Access

4. Token Refresh:
   Refresh Token → Backend Validation → New Access Token → Updated Storage

5. Logout:
   Frontend Action → Token Removal → API Cleanup → Redirect to Home
```

### Security Implementation

#### 1. Password Security
```python
# Strong password requirements enforced
def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one number")
    
    return len(errors) == 0, errors

# Password hashing with Argon2
def hash_password(password: str) -> str:
    return pwd_context.hash(password)
```

#### 2. JWT Token Management
```python
def create_token_pair(user_id: str, email: str) -> dict:
    # Short-lived access token (15 minutes)
    access_token = create_access_token(
        data={"sub": user_id, "email": email},
        expires_delta=timedelta(minutes=15)
    )
    
    # Long-lived refresh token (7 days)
    refresh_token = create_refresh_token(
        data={"sub": user_id, "email": email},
        expires_delta=timedelta(days=7)
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
```

#### 3. Frontend Token Handling
```javascript
// Automatic token refresh on API calls
const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await authAPI.refreshToken(refreshToken);
          localStorage.setItem('access_token', response.access_token);
          // Retry original request
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### Role-Based Access Control (RBAC)

```python
# Backend: Route-level protection
@router.post("/admin/papers/approve")
async def approve_paper(
    paper_id: str,
    current_user: User = Depends(get_current_admin_user),  # Admin only
    db: Session = Depends(get_db)
):
    pass

# Frontend: Component-level protection
const AdminPanel = () => {
  const { user, isAdmin } = useAuthStore();
  
  if (!isAdmin()) {
    return <div>Access Denied</div>;
  }
  
  return <AdminDashboard />;
};
```

---

## File Storage System

### S3-Compatible Storage Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   File Storage  │
│   File Upload   │───►│  File Validation│───►│   MinIO/AWS S3  │
│                 │    │  Virus Scanning │    │                 │
│                 │    │  Metadata Store │    │  Secure URLs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### File Upload Process

#### 1. Frontend Upload Component
```javascript
const FileUpload = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (file) => {
    setUploading(true);
    
    try {
      // Validate file type and size
      if (!['application/pdf'].includes(file.type)) {
        throw new Error('Only PDF files are allowed');
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File size must be less than 50MB');
      }
      
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        original_filename: file.name,
        file_size: file.size
      }));
      
      const response = await storageAPI.uploadFile(formData);
      onUpload(response);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="border-dashed border-2 border-gray-300 rounded-lg p-6">
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => handleUpload(e.target.files[0])}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {uploading ? 'Uploading...' : 'Click to upload PDF'}
      </label>
    </div>
  );
};
```

#### 2. Backend File Processing
```python
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    metadata: str = Form(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    if file.content_type != 'application/pdf':
        raise ValidationError("Only PDF files are allowed")
    
    # Read and validate file content
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise ValidationError("File too large")
    
    # Generate file hash to prevent duplicates
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Check for existing file
    existing_file = db.query(Paper).filter(Paper.file_hash == file_hash).first()
    if existing_file:
        raise ValidationError("File already exists")
    
    # Generate unique storage key
    file_extension = file.filename.split('.')[-1]
    storage_key = f"papers/{current_user.id}/{uuid4()}.{file_extension}"
    
    # Upload to S3
    upload_result = await storage_service.upload_file(
        storage_key=storage_key,
        content=content,
        content_type=file.content_type
    )
    
    return {
        "storage_key": storage_key,
        "file_hash": file_hash,
        "file_size": len(content),
        "upload_url": upload_result.url
    }
```

#### 3. Storage Service Implementation
```python
class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION
        )
        
    async def upload_file(self, storage_key: str, content: bytes, content_type: str):
        try:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET,
                Key=storage_key,
                Body=content,
                ContentType=content_type,
                Metadata={
                    'uploaded_at': datetime.utcnow().isoformat(),
                    'content_type': content_type
                }
            )
            
            return {"url": f"{settings.S3_ENDPOINT}/{settings.S3_BUCKET}/{storage_key}"}
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise StorageError("Failed to upload file")
    
    async def get_download_url(self, storage_key: str, expires_in: int = 3600):
        """Generate presigned URL for secure downloads"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.S3_BUCKET, 'Key': storage_key},
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate download URL: {e}")
            raise StorageError("Failed to generate download URL")
```

---

## API Documentation

### Core API Endpoints

#### Authentication Endpoints
```
POST /auth/register          # User registration
POST /auth/login             # User login
POST /auth/refresh           # Token refresh
GET  /auth/verify-email      # Email verification
POST /auth/request-password-reset  # Password reset request
POST /auth/reset-password    # Password reset confirmation
GET  /auth/me               # Get current user profile
PUT  /auth/me               # Update user profile
POST /auth/logout           # User logout
```

#### Papers Management
```
GET    /papers              # Search and filter papers
POST   /papers              # Upload new paper
GET    /papers/{id}         # Get paper details
PUT    /papers/{id}         # Update paper (owner/admin)
DELETE /papers/{id}         # Delete paper (owner/admin)
GET    /papers/{id}/download # Get download URL
POST   /papers/{id}/bookmark # Bookmark paper
POST   /papers/{id}/report   # Report paper
POST   /papers/{id}/rate     # Rate paper
```

#### Taxonomy Management
```
GET  /taxonomy/universities  # List universities
POST /taxonomy/universities  # Create university (admin)
GET  /taxonomy/programs      # List programs
GET  /taxonomy/branches      # List branches
GET  /taxonomy/subjects      # List subjects
```

#### Admin Endpoints
```
GET  /admin/papers/pending   # Pending papers for approval
POST /admin/papers/{id}/approve  # Approve paper
POST /admin/papers/{id}/reject   # Reject paper
GET  /admin/users            # User management
GET  /admin/analytics        # System analytics
GET  /admin/reports          # Content reports
```

### API Response Formats

#### Success Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Database Management Systems - Mid Term 2023",
  "description": "DBMS mid term examination paper",
  "exam_year": 2023,
  "status": "approved",
  "subject": {
    "id": "...",
    "name": "Database Management Systems",
    "code": "CS301"
  },
  "uploader": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "download_count": 156,
  "rating": 4.2,
  "created_at": "2023-12-01T10:30:00Z",
  "file_size": 2458624,
  "is_bookmarked": false
}
```

#### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

#### Paginated Response
```json
{
  "items": [...],
  "total": 156,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "has_next": true,
  "has_prev": false
}
```

---

## Code Structure Deep Dive

### Backend Design Patterns

#### 1. Repository Pattern
```python
# Abstract repository interface
class BaseRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get(self, id: UUID) -> Optional[Model]:
        pass
    
    def create(self, entity: CreateSchema) -> Model:
        pass
    
    def update(self, id: UUID, data: UpdateSchema) -> Model:
        pass
    
    def delete(self, id: UUID) -> bool:
        pass

# Concrete implementation
class PaperRepository(BaseRepository):
    def get_by_subject(self, subject_id: UUID) -> List[Paper]:
        return self.db.query(Paper).filter(
            Paper.subject_id == subject_id,
            Paper.status == PaperStatus.APPROVED
        ).all()
```

#### 2. Service Layer Pattern
```python
class PaperService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PaperRepository(db)
        self.storage_service = StorageService()
        self.analytics_service = AnalyticsService()
    
    async def create_paper(
        self, 
        paper_data: PaperCreate, 
        uploader: User,
        ip_address: str,
        user_agent: str
    ) -> Paper:
        # Business logic validation
        await self._validate_paper_data(paper_data)
        
        # Create paper record
        paper = self.repository.create(paper_data, uploader.id)
        
        # Log activity
        await self.analytics_service.log_activity(
            user_id=uploader.id,
            activity_type=ActivityType.UPLOAD,
            paper_id=paper.id,
            metadata={"ip_address": ip_address, "user_agent": user_agent}
        )
        
        # Send notification to moderators
        await self._notify_moderators_new_submission(paper)
        
        return paper
```

#### 3. Dependency Injection Container
```python
# deps.py - Centralized dependency management
def get_paper_service(db: Session = Depends(get_db)) -> PaperService:
    return PaperService(db)

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)

# Usage in routes
@router.post("/papers")
async def create_paper(
    paper_data: PaperCreate,
    paper_service: PaperService = Depends(get_paper_service),
    current_user: User = Depends(get_current_active_user)
):
    return await paper_service.create_paper(paper_data, current_user)
```

### Frontend Design Patterns

#### 1. Custom Hooks Pattern
```javascript
// hooks/usePagination.js
const usePagination = (initialPage = 1, initialPageSize = 20) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  const nextPage = () => hasNext && setPage(page + 1);
  const prevPage = () => hasPrev && setPage(page - 1);
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext,
    hasPrev,
    setTotalItems,
    nextPage,
    prevPage,
    goToPage,
    setPageSize
  };
};
```

#### 2. Compound Component Pattern
```javascript
// components/SearchFilters.jsx
const SearchFilters = ({ children, onFilterChange }) => {
  const [filters, setFilters] = useState({});
  
  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <div className="search-filters">
      {React.Children.map(children, child =>
        React.cloneElement(child, { updateFilter, filters })
      )}
    </div>
  );
};

const SearchFilters.Select = ({ name, options, updateFilter, filters }) => (
  <select
    value={filters[name] || ''}
    onChange={(e) => updateFilter(name, e.target.value)}
  >
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// Usage
<SearchFilters onFilterChange={handleFilterChange}>
  <SearchFilters.Select name="university" options={universities} />
  <SearchFilters.Select name="subject" options={subjects} />
</SearchFilters>
```

#### 3. Higher-Order Component (HOC) Pattern
```javascript
// hocs/withAuthentication.js
const withAuthentication = (WrappedComponent) => {
  return (props) => {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    
    if (isLoading) {
      return <Loading />;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" replace />;
    }
    
    return <WrappedComponent {...props} user={user} />;
  };
};

// Usage
const Dashboard = withAuthentication(({ user }) => {
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      {/* Dashboard content */}
    </div>
  );
});
```

### Database Query Optimization

#### 1. Eager Loading with SQLAlchemy
```python
# Optimized query with joins to prevent N+1 problems
def get_papers_with_taxonomy(filters: PaperSearchFilters) -> List[Paper]:
    query = (
        db.query(Paper)
        .join(Subject)
        .join(Semester)
        .join(Branch)
        .join(Program)
        .join(University)
        .options(
            joinedload(Paper.subject).joinedload(Subject.semester)
            .joinedload(Semester.branch).joinedload(Branch.program)
            .joinedload(Program.university)
        )
        .filter(Paper.status == PaperStatus.APPROVED)
    )
    
    # Apply filters dynamically
    if filters.university_id:
        query = query.filter(University.id == filters.university_id)
    
    if filters.subject_id:
        query = query.filter(Subject.id == filters.subject_id)
    
    if filters.exam_year:
        query = query.filter(Paper.exam_year == filters.exam_year)
    
    return query.all()
```

#### 2. Database Indexes
```python
# models.py - Strategic indexes for performance
class Paper(Base):
    __tablename__ = "papers"
    
    # Indexes for common query patterns
    __table_args__ = (
        Index("idx_papers_status_year", "status", "exam_year"),
        Index("idx_papers_subject_status", "subject_id", "status"),
        Index("idx_papers_uploader", "uploader_id"),
        Index("idx_papers_created_at", "created_at"),
    )
```

---

## Development Workflow

### Local Development Setup

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with API URL

# Start development server
npm run dev
```

#### 3. Docker Development Environment
```yaml
# docker-compose.yml - Complete development stack
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: uninoteshub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    volumes:
      - minio_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/uninoteshub
      - REDIS_URL=redis://redis:6379/0
      - S3_ENDPOINT=http://minio:9000
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis
      - minio

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
    depends_on:
      - backend

volumes:
  postgres_data:
  minio_data:
```

### Development Commands

```bash
# Start full development environment
docker-compose up --build

# Run backend tests
cd backend && pytest

# Run frontend linting
cd frontend && npm run lint

# Database operations
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head

# Generate API documentation
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
# Visit http://localhost:8000/docs
```

### Code Quality Tools

#### Backend Code Quality
```bash
# Format code with Black
black app/

# Sort imports with isort
isort app/

# Lint with Flake8
flake8 app/

# Type checking with MyPy
mypy app/

# Run all quality checks
pre-commit run --all-files
```

#### Frontend Code Quality
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error'
  }
};

// package.json scripts
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
```

### Testing Strategy

#### 1. Backend Testing
```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db
from app.db.models import User

client = TestClient(app)

def test_user_registration():
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePassword123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    assert response.status_code == 201
    assert "user_id" in response.json()

def test_user_login():
    # Create user first
    client.post("/auth/register", json={
        "email": "login@example.com",
        "password": "SecurePassword123"
    })
    
    # Verify email (in real tests, you'd mock this)
    # ... verification logic ...
    
    # Test login
    response = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "SecurePassword123"
    })
    
    assert response.status_code == 200
    assert "access_token" in response.json()
```

#### 2. Frontend Testing
```javascript
// tests/AuthStore.test.js
import { renderHook, act } from '@testing-library/react';
import useAuthStore from '../stores/authStore';
import { authAPI } from '../lib/api';

// Mock API
jest.mock('../lib/api', () => ({
  authAPI: {
    login: jest.fn(),
    logout: jest.fn(),
  }
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      accessToken: null
    });
  });

  test('login updates state correctly', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com' },
      access_token: 'mock-token'
    };
    
    authAPI.login.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password'
      });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe('test@example.com');
  });
});
```

---

## Security Implementation

### 1. Input Validation & Sanitization

#### Backend Validation with Pydantic
```python
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r"[a-z]", v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r"\d", v):
            raise ValueError('Password must contain digit')
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not re.match(r"^[a-zA-Z\s'-]+$", v):
            raise ValueError('Name contains invalid characters')
        return v.strip()

class PaperCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    exam_year: int = Field(..., ge=2000, le=2030)
    subject_id: UUID4
    tags: Optional[List[str]] = Field(None, max_items=10)
    
    @validator('title', 'description')
    def sanitize_text(cls, v):
        if v:
            # Remove potential XSS content
            import bleach
            return bleach.clean(v, tags=[], strip=True)
        return v
```

#### Frontend Validation
```javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const registrationSchema = yup.object({
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain uppercase letter')
    .matches(/[a-z]/, 'Password must contain lowercase letter')
    .matches(/\d/, 'Password must contain number')
    .required('Password is required'),
  firstName: yup
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .matches(/^[a-zA-Z\s'-]+$/, 'Invalid characters in name')
    .required('First name is required'),
});

const RegistrationForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registrationSchema)
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      {/* ... other fields */}
    </form>
  );
};
```

### 2. SQL Injection Prevention

```python
# Safe parameterized queries with SQLAlchemy
def search_papers(self, filters: PaperSearchFilters) -> List[Paper]:
    query = self.db.query(Paper)
    
    # SQLAlchemy ORM automatically prevents SQL injection
    if filters.search:
        query = query.filter(
            Paper.title.ilike(f"%{filters.search}%")  # Safe parameter binding
        )
    
    if filters.exam_year:
        query = query.filter(Paper.exam_year == filters.exam_year)  # Type-safe
    
    return query.all()

# For raw SQL (if needed), always use parameters
def custom_query(self, user_id: UUID) -> List[dict]:
    result = self.db.execute(
        text("SELECT * FROM papers WHERE uploader_id = :user_id"),
        {"user_id": str(user_id)}  # Safe parameter binding
    )
    return result.fetchall()
```

### 3. CORS Configuration

```python
# main.py - Secure CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,  # Specific origins only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page-Count"]
)

# settings.py - Environment-based CORS
class Settings(BaseSettings):
    CORS_ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # Development frontend
        "http://localhost:5173",  # Vite dev server
        "https://uninoteshub.com"  # Production domain
    ]
    
    @validator('CORS_ALLOWED_ORIGINS', pre=True)
    def validate_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
```

### 4. Rate Limiting

```python
# middleware/ratelimit.py
import redis
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_url: str):
        super().__init__(app)
        self.redis = redis.from_url(redis_url)
        
        # Rate limit rules
        self.rules = {
            "/auth/login": (5, 300),      # 5 attempts per 5 minutes
            "/auth/register": (3, 3600),   # 3 attempts per hour
            "/papers": (100, 3600),        # 100 requests per hour
            "default": (1000, 3600)        # Default: 1000 per hour
        }
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        path = request.url.path
        method = request.method
        
        # Skip rate limiting for certain paths
        if path.startswith('/static') or path == '/healthz':
            return await call_next(request)
        
        # Get rate limit rule
        rule_key = f"{method} {path}"
        limit, window = self.rules.get(rule_key, self.rules["default"])
        
        # Check rate limit
        key = f"rate_limit:{client_ip}:{rule_key}"
        current = self.redis.get(key)
        
        if current is None:
            # First request
            self.redis.setex(key, window, 1)
        else:
            current = int(current)
            if current >= limit:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests",
                    headers={"Retry-After": str(window)}
                )
            self.redis.incr(key)
        
        return await call_next(request)
```

### 5. File Upload Security

```python
import magic  # python-magic for file type detection

async def validate_uploaded_file(file: UploadFile) -> None:
    # Read file content
    content = await file.read()
    await file.seek(0)  # Reset file pointer
    
    # Validate file size
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise ValidationError("File too large")
    
    # Validate file type using magic numbers (more secure than extension)
    file_type = magic.from_buffer(content, mime=True)
    allowed_types = ['application/pdf']
    
    if file_type not in allowed_types:
        raise ValidationError(f"File type {file_type} not allowed")
    
    # Check for malicious content (basic PDF structure validation)
    if not content.startswith(b'%PDF-'):
        raise ValidationError("Invalid PDF file")
    
    # Scan for embedded scripts (basic check)
    dangerous_keywords = [b'/JavaScript', b'/JS', b'/OpenAction', b'/Launch']
    for keyword in dangerous_keywords:
        if keyword in content:
            raise ValidationError("Potentially malicious PDF detected")
```

### 6. Error Handling & Information Disclosure

```python
# utils/errors.py - Custom exception hierarchy
class APIError(Exception):
    def __init__(self, status_code: int, error_code: str, detail: str, details: dict = None):
        self.status_code = status_code
        self.error_code = error_code
        self.detail = detail
        self.details = details or {}

class ValidationError(APIError):
    def __init__(self, detail: str, details: dict = None):
        super().__init__(422, "VALIDATION_ERROR", detail, details)

class AuthenticationError(APIError):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(401, "AUTHENTICATION_ERROR", detail)

class PermissionDeniedError(APIError):
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(403, "PERMISSION_DENIED", detail)

# main.py - Secure error handling
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # Log the actual error for debugging
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Don't expose internal details in production
    if settings.is_production:
        detail = "An internal error occurred"
    else:
        detail = str(exc)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": detail,
                "request_id": getattr(request.state, "request_id", "unknown")
            }
        }
    )
```

---

## Deployment & Infrastructure

### Docker Production Configuration

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy application code
COPY . .
RUN chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

EXPOSE 8000

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 256M

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - JWT_SECRET=${JWT_SECRET}
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      - postgres
      - redis
    networks:
      - backend
      - frontend
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - frontend
    deploy:
      resources:
        limits:
          memory: 128M

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - frontend

volumes:
  postgres_data:
  redis_data:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

### CI/CD Pipeline with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        working-directory: ./backend
        run: |
          pip install -r requirements.txt
      
      - name: Run tests
        working-directory: ./backend
        run: |
          pytest
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test
      
      - name: Build frontend
        working-directory: ./frontend
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/uninoteshub
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
            
            # Run database migrations
            docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
            
            # Health check
            sleep 30
            curl -f http://localhost/healthz || exit 1
```

### Monitoring & Logging

#### Application Monitoring
```python
# main.py - Monitoring setup
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from prometheus_fastapi_instrumentator import Instrumentator

# Sentry error tracking
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
    )

# Prometheus metrics
if settings.is_production:
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Custom metrics
from prometheus_client import Counter, Histogram

request_count = Counter('http_requests_total', 'Total requests', ['method', 'endpoint'])
request_duration = Histogram('http_request_duration_seconds', 'Request duration')

@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    # Record metrics
    request_count.labels(
        method=request.method,
        endpoint=request.url.path
    ).inc()
    
    request_duration.observe(time.time() - start_time)
    
    return response
```

#### Log Configuration
```python
# config.py - Structured logging
import structlog

def configure_logging():
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

# Usage in services
logger = structlog.get_logger(__name__)

async def create_paper(self, paper_data: PaperCreate):
    logger.info(
        "Creating new paper",
        user_id=str(uploader.id),
        title=paper_data.title,
        subject_id=str(paper_data.subject_id)
    )
```

---

## Conclusion

UniNotesHub represents a **production-ready, scalable web application** built with modern technologies and best practices. Here's what makes this project special:

### Technical Excellence
- **Clean Architecture**: Separation of concerns with distinct layers (API, Service, Repository)
- **Type Safety**: Pydantic schemas and TypeScript ensure data integrity
- **Security First**: JWT authentication, rate limiting, input validation, and RBAC
- **Performance**: Database optimization, caching, and efficient queries
- **Scalability**: Containerized deployment, horizontal scaling capability

### Development Best Practices
- **Code Quality**: Linting, formatting, and pre-commit hooks
- **Testing**: Comprehensive unit and integration tests
- **Documentation**: API docs, code comments, and this comprehensive guide
- **CI/CD**: Automated testing and deployment pipelines
- **Monitoring**: Error tracking, metrics, and structured logging

### Business Value
- **User Experience**: Intuitive UI, fast search, and responsive design
- **Content Management**: Hierarchical organization and moderation workflow
- **Analytics**: User activity tracking and content statistics
- **Community Features**: Bookmarking, rating, and reporting system

This project demonstrates how to build a **real-world application** that can handle thousands of users, millions of documents, and complex academic hierarchies while maintaining code quality and security standards.

Whether you're learning full-stack development or building a similar platform, this codebase provides a solid foundation with room for growth and customization.

---

## Next Steps for Enhancement

1. **Full-Text Search**: Implement Elasticsearch for document content search
2. **Real-Time Features**: Add WebSocket support for live notifications
3. **Mobile App**: React Native or Flutter mobile application
4. **AI Features**: Content recommendations and automatic categorization
5. **Multi-Language**: Internationalization support
6. **Advanced Analytics**: User behavior analysis and content insights
7. **API Rate Limiting**: More sophisticated rate limiting strategies
8. **Caching Layer**: Redis-based caching for improved performance

This documentation serves as both a learning resource and a practical guide for anyone working with modern web applications. The combination of FastAPI and React provides a powerful, maintainable, and scalable solution for complex web platforms.
