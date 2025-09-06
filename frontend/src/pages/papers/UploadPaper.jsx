import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { papersAPI, taxonomyAPI, storageAPI } from '../../lib/api';
import { dispatchActivityUpdate, ACTIVITY_TYPES } from '../../utils/activityEvents';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const UploadPaper = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam_year: new Date().getFullYear(),
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
    console.log('UploadPaper: Fetching universities...');
    try {
      const data = await taxonomyAPI.getUniversities();
      console.log('UploadPaper: Universities fetched:', data);
      setUniversities(data);
      console.log('UploadPaper: Universities state updated');
    } catch (error) {
      console.error('UploadPaper: Error fetching universities:', error);
      toast.error('Failed to load universities');
    } finally {
      setIsLoadingTaxonomy(false);
      console.log('UploadPaper: Loading taxonomy set to false');
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.exam_year) {
      newErrors.exam_year = 'Exam year is required';
    } else if (formData.exam_year < 2000 || formData.exam_year > new Date().getFullYear() + 1) {
      newErrors.exam_year = 'Please enter a valid exam year';
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
      
      // Step 3: Create paper record
      const paperData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        exam_year: parseInt(formData.exam_year),
        subject_id: formData.subject_id,
        storage_key: uploadData.storage_key || uploadData.fields?.key,
        original_filename: formData.file.name,
        file_size: formData.file.size,
        mime_type: formData.file.type,
        file_hash: 'dev-hash-' + Date.now(), // Temporary hash for development
        tags: formData.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || []
      };
      
      const paper = await papersAPI.createPaper(paperData);
      
      // Dispatch activity update event
      dispatchActivityUpdate(ACTIVITY_TYPES.UPLOAD, {
        paperId: paper.id,
        paperTitle: formData.title.trim()
      });
      
      toast.success('Paper uploaded successfully! It will be reviewed before publication.');
      navigate('/my-papers');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload paper. Please try again.');
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
            Please verify your email address before uploading papers.
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Paper</h1>
        <p className="text-gray-600">
          Share your academic papers and notes to help fellow students. All uploads are reviewed before publication.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paper Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  name="title"
                  label="Paper Title"
                  placeholder="e.g., Database Management Systems - Question Paper"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  required
                />
              </div>
              
              <Input
                name="exam_year"
                type="number"
                label="Exam Year"
                placeholder={new Date().getFullYear()}
                value={formData.exam_year}
                onChange={handleInputChange}
                error={errors.exam_year}
                min="2000"
                max={new Date().getFullYear() + 1}
                required
              />
              
              <Input
                name="tags"
                label="Tags (Optional)"
                placeholder="midterm, final, practice (comma separated)"
                value={formData.tags}
                onChange={handleInputChange}
                help="Add relevant tags to help others find your paper"
              />
            </div>

            <Textarea
              name="description"
              label="Description (Optional)"
              placeholder="Brief description of the paper content..."
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
                {isLoading ? 'Uploading...' : 'Upload Paper'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/my-papers')}
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
            <span>Only upload papers you have the right to share</span>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPaper;
