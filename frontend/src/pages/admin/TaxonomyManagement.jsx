import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronRight, Building, BookOpen, GitBranch, Calendar, Book } from 'lucide-react';
import { Card, Button, Input, Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter, Alert, Loading } from '../../components';
import useTaxonomyStore from '../../stores/taxonomyStore';
import toast from 'react-hot-toast';

const TaxonomyManagement = () => {
  const {
    universities,
    programs,
    branches,
    semesters,
    subjects,
    isLoadingUniversities,
    isLoadingPrograms,
    isLoadingBranches,
    isLoadingSemesters,
    isLoadingSubjects,
    selectedUniversity,
    selectedProgram,
    selectedBranch,
    selectedSemester,
    fetchUniversities,
    fetchPrograms,
    fetchBranches,
    fetchSemesters,
    fetchSubjects,
    createUniversity,
    createProgram,
    createBranch,
    createSemester,
    createSubject,
    updateUniversity,
    updateProgram,
    updateBranch,
    updateSemester,
    updateSubject,
    deleteUniversity,
    deleteProgram,
    deleteBranch,
    deleteSemester,
    deleteSubject,
    setSelectedUniversity,
    setSelectedProgram,
    setSelectedBranch,
    setSelectedSemester
  } = useTaxonomyStore();

  const [activeTab, setActiveTab] = useState('universities');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [modalEntity, setModalEntity] = useState('university');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
    setModalType('create');
  };

  const openModal = (entity, type = 'create', item = null) => {
    setModalEntity(entity);
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'edit' && item) {
      setFormData({ ...item });
    } else {
      setFormData({});
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', { modalType, modalEntity, formData });
    
    try {
      if (modalType === 'create') {
        await handleCreate();
      } else {
        await handleUpdate();
      }
      console.log('Operation completed successfully');
      closeModal();
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const handleCreate = async () => {
    console.log('Creating entity:', { modalEntity, formData });
    
    try {
      switch (modalEntity) {
        case 'university':
          console.log('Calling createUniversity with:', formData);
          const result = await createUniversity(formData);
          console.log('University created:', result);
          break;
        case 'program':
          if (!selectedUniversity) {
            throw new Error('Please select a university first');
          }
          console.log('Calling createProgram with:', formData);
          await createProgram(formData);
          break;
        case 'branch':
          if (!selectedProgram) {
            throw new Error('Please select a program first');
          }
          console.log('Calling createBranch with:', formData);
          await createBranch(formData);
          break;
        case 'semester':
          if (!selectedBranch) {
            throw new Error('Please select a branch first');
          }
          console.log('Calling createSemester with:', formData);
          await createSemester(formData);
          break;
        case 'subject':
          if (!selectedSemester) {
            throw new Error('Please select a semester first');
          }
          console.log('Calling createSubject with:', formData);
          await createSubject(formData);
          break;
        default:
          throw new Error(`Unknown entity type: ${modalEntity}`);
      }
    } catch (error) {
      console.error('HandleCreate error:', error);
      throw error; // Re-throw to be handled by handleSubmit
    }
  };

  const handleUpdate = async () => {
    switch (modalEntity) {
      case 'university':
        await updateUniversity(editingItem.id, formData);
        break;
      case 'program':
        await updateProgram(editingItem.id, formData);
        break;
      case 'branch':
        await updateBranch(editingItem.id, formData);
        break;
      case 'semester':
        await updateSemester(editingItem.id, formData);
        break;
      case 'subject':
        await updateSubject(editingItem.id, formData);
        break;
    }
  };

  const handleDelete = async (entity, item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      switch (entity) {
        case 'university':
          await deleteUniversity(item.id);
          break;
        case 'program':
          await deleteProgram(item.id);
          break;
        case 'branch':
          await deleteBranch(item.id);
          break;
        case 'semester':
          await deleteSemester(item.id);
          break;
        case 'subject':
          await deleteSubject(item.id);
          break;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleUniversitySelect = async (university) => {
    setSelectedUniversity(university);
    setActiveTab('programs');
    await fetchPrograms(university.id);
  };

  const handleProgramSelect = async (program) => {
    setSelectedProgram(program);
    setActiveTab('branches');
    await fetchBranches(program.id);
  };

  const handleBranchSelect = async (branch) => {
    setSelectedBranch(branch);
    setActiveTab('semesters');
    await fetchSemesters(branch.id);
  };

  const handleSemesterSelect = async (semester) => {
    setSelectedSemester(semester);
    setActiveTab('subjects');
    await fetchSubjects(semester.id);
  };

  const renderBreadcrumb = () => {
    const breadcrumb = [];
    
    if (selectedUniversity) {
      breadcrumb.push(selectedUniversity.name);
    }
    if (selectedProgram) {
      breadcrumb.push(selectedProgram.name);
    }
    if (selectedBranch) {
      breadcrumb.push(selectedBranch.name);
    }
    if (selectedSemester) {
      breadcrumb.push(selectedSemester.name);
    }

    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        {breadcrumb.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderFormFields = () => {
    switch (modalEntity) {
      case 'university':
        return (
          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter university name"
            />
            <Input
              label="Code"
              name="code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., MIT, IITD"
              help="Short identifier for the university"
            />
            <Input
              label="Location"
              name="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Cambridge, MA"
            />
            <Input
              label="Website"
              name="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.university.edu"
            />
          </div>
        );

      case 'program':
        return (
          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter program name"
            />
            <Input
              label="Duration (Years)"
              name="duration_years"
              type="number"
              min="1"
              max="10"
              value={formData.duration_years || ''}
              onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) || '' })}
              placeholder="4"
            />
          </div>
        );

      case 'branch':
        return (
          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter branch name"
            />
            <Input
              label="Code"
              name="code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., CSE, ECE"
            />
          </div>
        );

      case 'semester':
        return (
          <div className="space-y-4">
            <Input
              label="Semester Number"
              name="number"
              type="number"
              min="1"
              max="12"
              value={formData.number || ''}
              onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || '' })}
              placeholder="1"
              required
            />
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Semester 1 (auto-generated if empty)"
            />
          </div>
        );

      case 'subject':
        return (
          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter subject name"
            />
            <Input
              label="Code"
              name="code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., CS101, MA201"
            />
            <Input
              label="Credits"
              name="credits"
              type="number"
              min="1"
              max="10"
              value={formData.credits || ''}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || '' })}
              placeholder="3"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={`Enter ${modalEntity} name`}
            />
          </div>
        );
    }
  };

  const renderEntityList = (entities, entityType, isLoading, onSelect, icon) => {
    const Icon = icon;
    
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      );
    }

    if (entities.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {entityType}s found</p>
          <Button
            onClick={() => openModal(entityType)}
            className="mt-4"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First {entityType}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map((entity) => (
          <Card
            key={entity.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1" onClick={() => onSelect && onSelect(entity)}>
                <div className="flex items-center mb-2">
                  <Icon className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="font-medium text-gray-900">{entity.name}</h3>
                </div>
                
                {entity.code && (
                  <p className="text-sm text-gray-500 mb-1">Code: {entity.code}</p>
                )}
                
                {entity.location && (
                  <p className="text-sm text-gray-500 mb-1">Location: {entity.location}</p>
                )}
                
                {entity.duration_years && (
                  <p className="text-sm text-gray-500 mb-1">Duration: {entity.duration_years} years</p>
                )}
                
                {entity.number && (
                  <p className="text-sm text-gray-500 mb-1">Semester {entity.number}</p>
                )}
                
                {entity.credits && (
                  <p className="text-sm text-gray-500 mb-1">Credits: {entity.credits}</p>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(entityType, 'edit', entity);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entityType, entity);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const tabs = [
    { key: 'universities', label: 'Universities', icon: Building, count: universities.length },
    { key: 'programs', label: 'Programs', icon: BookOpen, count: programs.length, disabled: !selectedUniversity },
    { key: 'branches', label: 'Branches', icon: GitBranch, count: branches.length, disabled: !selectedProgram },
    { key: 'semesters', label: 'Semesters', icon: Calendar, count: semesters.length, disabled: !selectedBranch },
    { key: 'subjects', label: 'Subjects', icon: Book, count: subjects.length, disabled: !selectedSemester },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxonomy Management</h1>
          <p className="text-gray-600">Manage universities, programs, branches, semesters, and subjects</p>
        </div>
      </div>

      {renderBreadcrumb()}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key)}
                disabled={tab.disabled}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : tab.disabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {tabs.find(tab => tab.key === activeTab)?.label}
          </h2>
          <Button
            onClick={() => {
              let entityName = activeTab;
              if (entityName === 'universities') entityName = 'university';
              else if (entityName === 'programs') entityName = 'program';
              else if (entityName === 'branches') entityName = 'branch';
              else if (entityName === 'semesters') entityName = 'semester';
              else if (entityName === 'subjects') entityName = 'subject';
              openModal(entityName);
            }}
            disabled={
              (activeTab === 'programs' && !selectedUniversity) ||
              (activeTab === 'branches' && !selectedProgram) ||
              (activeTab === 'semesters' && !selectedBranch) ||
              (activeTab === 'subjects' && !selectedSemester)
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'universities' ? 'University' : 
                 activeTab === 'programs' ? 'Program' : 
                 activeTab === 'branches' ? 'Branch' : 
                 activeTab === 'semesters' ? 'Semester' : 'Subject'}
          </Button>
        </div>

        {activeTab === 'universities' && renderEntityList(
          universities,
          'university',
          isLoadingUniversities,
          handleUniversitySelect,
          Building
        )}

        {activeTab === 'programs' && renderEntityList(
          programs,
          'program',
          isLoadingPrograms,
          handleProgramSelect,
          BookOpen
        )}

        {activeTab === 'branches' && renderEntityList(
          branches,
          'branch',
          isLoadingBranches,
          handleBranchSelect,
          GitBranch
        )}

        {activeTab === 'semesters' && renderEntityList(
          semesters,
          'semester',
          isLoadingSemesters,
          handleSemesterSelect,
          Calendar
        )}

        {activeTab === 'subjects' && renderEntityList(
          subjects,
          'subject',
          isLoadingSubjects,
          null,
          Book
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
      >
        <ModalHeader onClose={closeModal}>
          <ModalTitle>
            {modalType === 'create' ? 'Add' : 'Edit'} {modalEntity.charAt(0).toUpperCase() + modalEntity.slice(1)}
          </ModalTitle>
        </ModalHeader>
        
        <form onSubmit={handleSubmit}>
          <ModalContent>
            {renderFormFields()}
          </ModalContent>
          
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {modalType === 'create' ? 'Create' : 'Update'} {modalEntity.charAt(0).toUpperCase() + modalEntity.slice(1)}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default TaxonomyManagement;
