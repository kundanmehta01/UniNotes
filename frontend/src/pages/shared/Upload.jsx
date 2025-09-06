import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button, 
  Input,
  Textarea,
  Select,
  Alert,
  AlertDescription,
  Loading,
  FileUpload,
  Badge
} from '../../components';
import { papersAPI, notesAPI, taxonomyAPI, storageAPI, logUserActivity, logNoteActivity, ACTIVITY_TYPES } from '../../lib/api';
import { dispatchActivityUpdate } from '../../utils/activityEvents';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  
  // Get content type from URL params or default to 'paper'
  const initialContentType = searchParams.get('type') || 'paper';
  
  const [contentType, setContentType] = useState(initialContentType);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(), // For papers: exam_year, for notes: semester_year
    subject_id: '',
    file: null,
    tags: ''
  });
  
  // Taxonomy data
  const [universities, setUniversities] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Selected taxonomy
  const [selectedTaxonomy, setSelectedTaxonomy] = useState({
    university: '',
    program: '',
    branch: '',
    semester: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (selectedTaxonomy.university) {
      fetchPrograms(selectedTaxonomy.university);
      resetDownstreamSelections(['program', 'branch', 'semester', 'subject']);
    }
  }, [selectedTaxonomy.university]);

  useEffect(() => {
    if (selectedTaxonomy.program) {
      fetchBranches(selectedTaxonomy.program);
      resetDownstreamSelections(['branch', 'semester', 'subject']);
    }
  }, [selectedTaxonomy.program]);

  useEffect(() => {
    if (selectedTaxonomy.branch) {
      fetchSemesters(selectedTaxonomy.branch);
      resetDownstreamSelections(['semester', 'subject']);
    }
  }, [selectedTaxonomy.branch]);

  useEffect(() => {
    if (selectedTaxonomy.semester) {
      fetchSubjects(selectedTaxonomy.semester);
      resetDownstreamSelections(['subject']);
    }
  }, [selectedTaxonomy.semester]);

  const resetDownstreamSelections = (fields) => {
    const updates = {};
    if (fields.includes('program')) { setPrograms([]); updates.program = ''; }
    if (fields.includes('branch')) { setBranches([]); updates.branch = ''; }
    if (fields.includes('semester')) { setSemesters([]); updates.semester = ''; }
    if (fields.includes('subject')) { setSubjects([]); setFormData(prev => ({ ...prev, subject_id: '' })); }
    
    setSelectedTaxonomy(prev => ({ ...prev, ...updates }));
  };

  const fetchUniversities = async () => {
    console.log('Upload: Fetching universities...');
    try {
      const data = await taxonomyAPI.getUniversities();
      console.log('Upload: Universities fetched:', data);
      setUniversities(data);
      console.log('Upload: Universities state updated');
    } catch (error) {
      console.error('Upload: Error fetching universities:', error);
      toast.error('Failed to load universities');
    } finally {
      setIsLoadingTaxonomy(false);
      console.log('Upload: Loading taxonomy set to false');
    }
  };

  const fetchPrograms = async (universityId) => {
    try {
      const data = await taxonomyAPI.getPrograms(universityId);
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load programs');
    }
  };

  const fetchBranches = async (programId) => {
    try {
      const data = await taxonomyAPI.getBranches(programId);
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    }
  };

  const fetchSemesters = async (branchId) => {
    try {
      const data = await taxonomyAPI.getSemesters(branchId);
      setSemesters(data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to load semesters');
    }
  };

  const fetchSubjects = async (semesterId) => {
    try {
      const data = await taxonomyAPI.getSubjects(semesterId);
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTaxonomyChange = (field, value) => {
    setSelectedTaxonomy(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file) => {
    setFormData(prev => ({ ...prev, file }));
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleContentTypeChange = (newType) => {
    setContentType(newType);
    // Update URL without reloading
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('type', newType);
    window.history.replaceState({}, '', newUrl);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.year) {
      newErrors.year = contentType === 'paper' ? 'Exam year is required' : 'Semester year is required';
    } else if (formData.year < 2000 || formData.year > new Date().getFullYear() + 10) {
      newErrors.year = 'Please enter a valid year';
    }
    
    if (!selectedTaxonomy.university) {
      newErrors.university = 'University is required';
    }
    
    if (!selectedTaxonomy.program) {
      newErrors.program = 'Program is required';
    }
    
    if (!selectedTaxonomy.branch) {
      newErrors.branch = 'Branch is required';
    }
    
    if (!selectedTaxonomy.semester) {
      newErrors.semester = 'Semester is required';
    }
    
    if (!formData.subject_id) {
      newErrors.subject_id = 'Subject is required';
    }
    
    if (!formData.file) {
      newErrors.file = 'Please select a file to upload';
    } else {
      // File validation
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = ['application/pdf'];
      
      if (formData.file.size > maxSize) {
        newErrors.file = 'File size must be less than 50MB';
      }
      
      if (!allowedTypes.includes(formData.file.type)) {
        newErrors.file = 'Only PDF files are allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Get presigned upload URL
      const uploadData = await storageAPI.getUploadUrl(
        formData.file.name,
        formData.file.type
      );
      
      // Step 2: Upload file to S3
      await storageAPI.uploadFile(
        uploadData,
        formData.file,
        (progress) => setUploadProgress(progress)
      );
      
      // Step 3: Create record (paper or note)
      const recordData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        subject_id: formData.subject_id,
        storage_key: uploadData.storage_key || uploadData.fields?.key,
        original_filename: formData.file.name,
        file_size: formData.file.size,
        mime_type: formData.file.type,
        file_hash: 'dev-hash-' + Date.now(), // Temporary hash for development
        tags: formData.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || []
      };

      let result;
      if (contentType === 'paper') {
        recordData.exam_year = parseInt(formData.year);
        result = await papersAPI.createPaper(recordData);
        
        // Dispatch activity update event
        dispatchActivityUpdate(ACTIVITY_TYPES.UPLOAD, {
          paperId: result.id,
          paperTitle: formData.title.trim()
        });
        
        toast.success('Paper uploaded successfully! It will be reviewed before publication.');
        navigate('/my-papers');
      } else {
        recordData.semester_year = parseInt(formData.year);
        result = await notesAPI.createNote(recordData);
        
        // Log note activity  
        logNoteActivity(ACTIVITY_TYPES.UPLOAD, result.id, {
          noteTitle: formData.title.trim()
        });
        
        toast.success('Notes uploaded successfully! They will be reviewed before publication.');
        navigate('/my-notes');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${contentType}. Please try again.`);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  if (!user?.is_email_verified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert>
          <AlertDescription>
            Please verify your email address before uploading content.
            <Button
              variant="link"
              className="p-0 ml-2 h-auto"
              onClick={() => navigate('/auth/verify-email')}
            >
              Verify Email
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pageTitle = contentType === 'paper' ? 'Upload Paper' : 'Upload Notes';
  const yearLabel = contentType === 'paper' ? 'Exam Year' : 'Semester Year';
  const yearPlaceholder = contentType === 'paper' ? 'Year of the exam paper' : 'Year when these notes were taken';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Academic Content</h1>
        <p className="text-lg text-gray-600 mb-6">
          Help fellow students by sharing your academic resources. Choose what you'd like to upload:
        </p>
        
        {/* Content Type Selector */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`cursor-pointer p-6 border-2 rounded-xl text-center transition-all duration-200 ${
                contentType === 'paper'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-25'
              }`}
              onClick={() => handleContentTypeChange('paper')}
            >
              <div className="text-4xl mb-3">📄</div>
              <div className={`font-bold text-xl mb-2 ${
                contentType === 'paper' ? 'text-blue-700' : 'text-gray-700'
              }`}>
                Papers & PYQs
              </div>
              <div className={`text-sm mb-3 ${
                contentType === 'paper' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Upload question papers, exam papers, and previous year questions
              </div>
              {contentType === 'paper' && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Selected
                </Badge>
              )}
            </div>

            <div
              className={`cursor-pointer p-6 border-2 rounded-xl text-center transition-all duration-200 ${
                contentType === 'notes'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-25'
              }`}
              onClick={() => handleContentTypeChange('notes')}
            >
              <div className="text-4xl mb-3">📝</div>
              <div className={`font-bold text-xl mb-2 ${
                contentType === 'notes' ? 'text-green-700' : 'text-gray-700'
              }`}>
                Study Notes
              </div>
              <div className={`text-sm mb-3 ${
                contentType === 'notes' ? 'text-green-600' : 'text-gray-600'
              }`}>
                Upload study notes, lecture materials, and reference content
              </div>
              {contentType === 'notes' && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Selected
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg mb-8 ${
          contentType === 'paper' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'
        }`}>
          <p className="font-medium">
            {contentType === 'paper' 
              ? '📄 Upload your exam papers and question papers to help fellow students'
              : '📝 Upload your study notes and materials to help fellow students'
            }
          </p>
          <p className="text-sm mt-1 opacity-75">
            All uploads are reviewed before publication to ensure quality and appropriateness.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={contentType === 'paper' ? 'text-blue-600' : 'text-green-600'}>
              {contentType === 'paper' ? '📄' : '📝'}
            </span>
            {pageTitle} - Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Content Type Indicator */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Content Type:</span>
                <Badge className={contentType === 'paper' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                  {contentType === 'paper' ? 'Papers & PYQs' : 'Notes & Study Materials'}
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs"
              >
                Change Type
              </Button>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  name="title"
                  label="Title"
                  placeholder={`e.g., ${contentType === 'paper' ? 'Database Management Systems - Question Paper' : 'Database Concepts - Detailed Notes'}`}
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  required
                />
              </div>
              
              <Input
                name="year"
                type="number"
                label={yearLabel}
                placeholder={yearPlaceholder}
                value={formData.year}
                onChange={handleInputChange}
                error={errors.year}
                min="2000"
                max={new Date().getFullYear() + 10}
                required
              />
              
              <Input
                name="tags"
                label="Tags (Optional)"
                placeholder={contentType === 'paper' ? 'midterm, final, practice (comma separated)' : 'comprehensive, unit-wise, formulas (comma separated)'}
                value={formData.tags}
                onChange={handleInputChange}
                help={`Add relevant tags to help others find your ${contentType === 'paper' ? 'paper' : 'notes'}`}
              />
            </div>

            <Textarea
              name="description"
              label="Description (Optional)"
              placeholder={`Brief description of the ${contentType === 'paper' ? 'paper' : 'notes'} content...`}
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />

            {/* Academic Hierarchy */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Academic Classification
              </h3>
              
              {isLoadingTaxonomy ? (
                <div className="flex justify-center py-4">
                  <Loading />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="University"
                    value={selectedTaxonomy.university}
                    onChange={(value) => handleTaxonomyChange('university', value)}
                    error={errors.university}
                    required
                    options={[
                      { value: '', label: 'Select University' },
                      ...universities.map((uni) => ({
                        value: uni.id,
                        label: uni.name
                      }))
                    ]}
                  />

                  <Select
                    label="Program"
                    value={selectedTaxonomy.program}
                    onChange={(value) => handleTaxonomyChange('program', value)}
                    error={errors.program}
                    disabled={!selectedTaxonomy.university}
                    required
                    options={[
                      { value: '', label: 'Select Program' },
                      ...programs.map((program) => ({
                        value: program.id,
                        label: program.name
                      }))
                    ]}
                  />

                  <Select
                    label="Branch"
                    value={selectedTaxonomy.branch}
                    onChange={(value) => handleTaxonomyChange('branch', value)}
                    error={errors.branch}
                    disabled={!selectedTaxonomy.program}
                    required
                    options={[
                      { value: '', label: 'Select Branch' },
                      ...branches.map((branch) => ({
                        value: branch.id,
                        label: branch.name
                      }))
                    ]}
                  />

                  <Select
                    label="Semester"
                    value={selectedTaxonomy.semester}
                    onChange={(value) => handleTaxonomyChange('semester', value)}
                    error={errors.semester}
                    disabled={!selectedTaxonomy.branch}
                    required
                    options={[
                      { value: '', label: 'Select Semester' },
                      ...semesters.map((semester) => ({
                        value: semester.id,
                        label: semester.name || `Semester ${semester.number}`
                      }))
                    ]}
                  />

                  <div className="md:col-span-2">
                    <Select
                      label="Subject"
                      value={formData.subject_id}
                      onChange={(value) => handleInputChange({ target: { name: 'subject_id', value } })}
                      error={errors.subject_id}
                      disabled={!selectedTaxonomy.semester}
                      required
                      options={[
                        { value: '', label: 'Select Subject' },
                        ...subjects.map((subject) => ({
                          value: subject.id,
                          label: subject.code ? `${subject.code} - ${subject.name}` : subject.name
                        }))
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                File Upload
              </h3>
              
              <FileUpload
                onFileSelect={handleFileChange}
                accept=".pdf"
                maxSize={50 * 1024 * 1024} // 50MB
                error={errors.file}
                help="Only PDF files up to 50MB are allowed"
              />
              
              {formData.file && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Badge variant="outline">
                    {formData.file.name}
                  </Badge>
                  <span>
                    ({(formData.file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                loading={isLoading}
                disabled={isLoading}
                className="flex-1 md:flex-none md:px-8"
              >
                {isLoading ? 'Uploading...' : `Upload ${contentType === 'paper' ? 'Paper' : 'Notes'}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Only upload content you have the right to share</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Ensure file names are descriptive and appropriate</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>All uploads are reviewed before being made available</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Inappropriate content will be removed and may result in account suspension</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>
              {contentType === 'paper' 
                ? 'For papers: Include question papers, previous year questions, and exam materials'
                : 'For notes: Include study notes, lecture materials, and reference content'
              }
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
