import { create } from 'zustand';
import { taxonomyAPI } from '../lib/api';
import toast from 'react-hot-toast';

const useTaxonomyStore = create((set, get) => ({
  // State
  universities: [],
  programs: [],
  branches: [],
  semesters: [],
  subjects: [],
  
  // Loading states
  isLoadingUniversities: false,
  isLoadingPrograms: false,
  isLoadingBranches: false,
  isLoadingSemesters: false,
  isLoadingSubjects: false,
  
  // Selected items for hierarchy
  selectedUniversity: null,
  selectedProgram: null,
  selectedBranch: null,
  selectedSemester: null,

  // Actions - Universities
  fetchUniversities: async () => {
    set({ isLoadingUniversities: true });
    
    try {
      const universities = await taxonomyAPI.getUniversities();
      set({
        universities,
        isLoadingUniversities: false,
      });
      return universities;
    } catch (error) {
      set({ isLoadingUniversities: false });
      throw error;
    }
  },

  createUniversity: async (universityData) => {
    try {
      console.log('TaxonomyStore: Creating university with data:', universityData);
      const university = await taxonomyAPI.createUniversity(universityData);
      console.log('TaxonomyStore: Received university from API:', university);
      
      const { universities } = get();
      console.log('TaxonomyStore: Current universities before adding:', universities);
      const newUniversities = [...universities, university];
      set({
        universities: newUniversities,
      });
      console.log('TaxonomyStore: Updated universities list:', newUniversities);
      
      toast.success('University created successfully!');
      return university;
    } catch (error) {
      console.error('TaxonomyStore: Error creating university:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
  },

  updateUniversity: async (universityId, universityData) => {
    try {
      const updatedUniversity = await taxonomyAPI.updateUniversity(universityId, universityData);
      
      const { universities } = get();
      const updatedUniversities = universities.map(uni => 
        uni.id === universityId ? updatedUniversity : uni
      );
      
      set({ universities: updatedUniversities });
      toast.success('University updated successfully!');
      return updatedUniversity;
    } catch (error) {
      throw error;
    }
  },

  deleteUniversity: async (universityId) => {
    try {
      await taxonomyAPI.deleteUniversity(universityId);
      
      const { universities } = get();
      const filteredUniversities = universities.filter(uni => uni.id !== universityId);
      
      set({ universities: filteredUniversities });
      toast.success('University deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  // Actions - Programs
  fetchPrograms: async (universityId = null) => {
    set({ isLoadingPrograms: true });
    
    try {
      const programs = await taxonomyAPI.getPrograms(universityId);
      set({
        programs,
        isLoadingPrograms: false,
      });
      return programs;
    } catch (error) {
      set({ isLoadingPrograms: false });
      throw error;
    }
  },

  createProgram: async (programData) => {
    try {
      const { selectedUniversity } = get();
      if (!selectedUniversity) {
        throw new Error('No university selected');
      }
      
      const program = await taxonomyAPI.createProgram(selectedUniversity.id, programData);
      
      const { programs } = get();
      set({
        programs: [...programs, program],
      });
      
      toast.success('Program created successfully!');
      return program;
    } catch (error) {
      throw error;
    }
  },

  updateProgram: async (programId, programData) => {
    try {
      const updatedProgram = await taxonomyAPI.updateProgram(programId, programData);
      
      const { programs } = get();
      const updatedPrograms = programs.map(prog => 
        prog.id === programId ? updatedProgram : prog
      );
      
      set({ programs: updatedPrograms });
      toast.success('Program updated successfully!');
      return updatedProgram;
    } catch (error) {
      throw error;
    }
  },

  deleteProgram: async (programId) => {
    try {
      await taxonomyAPI.deleteProgram(programId);
      
      const { programs } = get();
      const filteredPrograms = programs.filter(prog => prog.id !== programId);
      
      set({ programs: filteredPrograms });
      toast.success('Program deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  // Actions - Branches
  fetchBranches: async (programId = null) => {
    set({ isLoadingBranches: true });
    
    try {
      const branches = await taxonomyAPI.getBranches(programId);
      set({
        branches,
        isLoadingBranches: false,
      });
      return branches;
    } catch (error) {
      set({ isLoadingBranches: false });
      throw error;
    }
  },

  createBranch: async (branchData) => {
    try {
      const { selectedProgram } = get();
      if (!selectedProgram) {
        throw new Error('No program selected');
      }
      
      const branch = await taxonomyAPI.createBranch(selectedProgram.id, branchData);
      
      const { branches } = get();
      set({
        branches: [...branches, branch],
      });
      
      toast.success('Branch created successfully!');
      return branch;
    } catch (error) {
      throw error;
    }
  },

  updateBranch: async (branchId, branchData) => {
    try {
      const updatedBranch = await taxonomyAPI.updateBranch(branchId, branchData);
      
      const { branches } = get();
      const updatedBranches = branches.map(branch => 
        branch.id === branchId ? updatedBranch : branch
      );
      
      set({ branches: updatedBranches });
      toast.success('Branch updated successfully!');
      return updatedBranch;
    } catch (error) {
      throw error;
    }
  },

  deleteBranch: async (branchId) => {
    try {
      await taxonomyAPI.deleteBranch(branchId);
      
      const { branches } = get();
      const filteredBranches = branches.filter(branch => branch.id !== branchId);
      
      set({ branches: filteredBranches });
      toast.success('Branch deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  // Actions - Semesters
  fetchSemesters: async (branchId = null) => {
    set({ isLoadingSemesters: true });
    
    try {
      const semesters = await taxonomyAPI.getSemesters(branchId);
      set({
        semesters,
        isLoadingSemesters: false,
      });
      return semesters;
    } catch (error) {
      set({ isLoadingSemesters: false });
      throw error;
    }
  },

  createSemester: async (semesterData) => {
    try {
      const { selectedBranch } = get();
      if (!selectedBranch) {
        throw new Error('No branch selected');
      }
      
      const semester = await taxonomyAPI.createSemester(selectedBranch.id, semesterData);
      
      const { semesters } = get();
      set({
        semesters: [...semesters, semester],
      });
      
      toast.success('Semester created successfully!');
      return semester;
    } catch (error) {
      throw error;
    }
  },

  updateSemester: async (semesterId, semesterData) => {
    try {
      const updatedSemester = await taxonomyAPI.updateSemester(semesterId, semesterData);
      
      const { semesters } = get();
      const updatedSemesters = semesters.map(sem => 
        sem.id === semesterId ? updatedSemester : sem
      );
      
      set({ semesters: updatedSemesters });
      toast.success('Semester updated successfully!');
      return updatedSemester;
    } catch (error) {
      throw error;
    }
  },

  deleteSemester: async (semesterId) => {
    try {
      await taxonomyAPI.deleteSemester(semesterId);
      
      const { semesters } = get();
      const filteredSemesters = semesters.filter(sem => sem.id !== semesterId);
      
      set({ semesters: filteredSemesters });
      toast.success('Semester deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  // Actions - Subjects
  fetchSubjects: async (semesterId = null) => {
    set({ isLoadingSubjects: true });
    
    try {
      const subjects = await taxonomyAPI.getSubjects(semesterId);
      set({
        subjects,
        isLoadingSubjects: false,
      });
      return subjects;
    } catch (error) {
      set({ isLoadingSubjects: false });
      throw error;
    }
  },

  createSubject: async (subjectData) => {
    try {
      const { selectedSemester } = get();
      if (!selectedSemester) {
        throw new Error('No semester selected');
      }
      
      const subject = await taxonomyAPI.createSubject(selectedSemester.id, subjectData);
      
      const { subjects } = get();
      set({
        subjects: [...subjects, subject],
      });
      
      toast.success('Subject created successfully!');
      return subject;
    } catch (error) {
      throw error;
    }
  },

  updateSubject: async (subjectId, subjectData) => {
    try {
      const updatedSubject = await taxonomyAPI.updateSubject(subjectId, subjectData);
      
      const { subjects } = get();
      const updatedSubjects = subjects.map(sub => 
        sub.id === subjectId ? updatedSubject : sub
      );
      
      set({ subjects: updatedSubjects });
      toast.success('Subject updated successfully!');
      return updatedSubject;
    } catch (error) {
      throw error;
    }
  },

  deleteSubject: async (subjectId) => {
    try {
      await taxonomyAPI.deleteSubject(subjectId);
      
      const { subjects } = get();
      const filteredSubjects = subjects.filter(sub => sub.id !== subjectId);
      
      set({ subjects: filteredSubjects });
      toast.success('Subject deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  // Selection actions for hierarchical filtering
  setSelectedUniversity: (university) => {
    set({ 
      selectedUniversity: university,
      selectedProgram: null,
      selectedBranch: null,
      selectedSemester: null,
      programs: [],
      branches: [],
      semesters: [],
      subjects: [],
    });
  },

  setSelectedProgram: (program) => {
    set({ 
      selectedProgram: program,
      selectedBranch: null,
      selectedSemester: null,
      branches: [],
      semesters: [],
      subjects: [],
    });
  },

  setSelectedBranch: (branch) => {
    set({ 
      selectedBranch: branch,
      selectedSemester: null,
      semesters: [],
      subjects: [],
    });
  },

  setSelectedSemester: (semester) => {
    set({ 
      selectedSemester: semester,
      subjects: [],
    });
  },

  // Clear selections
  clearSelections: () => {
    set({
      selectedUniversity: null,
      selectedProgram: null,
      selectedBranch: null,
      selectedSemester: null,
    });
  },

  // Utility functions
  getUniversityById: (universityId) => {
    const { universities } = get();
    return universities.find(uni => uni.id === universityId);
  },

  getProgramById: (programId) => {
    const { programs } = get();
    return programs.find(prog => prog.id === programId);
  },

  getBranchById: (branchId) => {
    const { branches } = get();
    return branches.find(branch => branch.id === branchId);
  },

  getSemesterById: (semesterId) => {
    const { semesters } = get();
    return semesters.find(sem => sem.id === semesterId);
  },

  getSubjectById: (subjectId) => {
    const { subjects } = get();
    return subjects.find(sub => sub.id === subjectId);
  },

  // Get full hierarchy path
  getHierarchyPath: () => {
    const { selectedUniversity, selectedProgram, selectedBranch, selectedSemester } = get();
    return {
      university: selectedUniversity,
      program: selectedProgram,
      branch: selectedBranch,
      semester: selectedSemester,
    };
  },

  // Load hierarchy automatically
  loadHierarchy: async (universityId, programId = null, branchId = null, semesterId = null) => {
    try {
      // Load universities if not loaded
      const { universities } = get();
      if (universities.length === 0) {
        await get().fetchUniversities();
      }

      // Set selected university
      const university = get().getUniversityById(universityId);
      if (university) {
        get().setSelectedUniversity(university);
      }

      // Load and set program if provided
      if (programId) {
        await get().fetchPrograms(universityId);
        const program = get().getProgramById(programId);
        if (program) {
          get().setSelectedProgram(program);
        }

        // Load and set branch if provided
        if (branchId) {
          await get().fetchBranches(programId);
          const branch = get().getBranchById(branchId);
          if (branch) {
            get().setSelectedBranch(branch);
          }

          // Load and set semester if provided
          if (semesterId) {
            await get().fetchSemesters(branchId);
            const semester = get().getSemesterById(semesterId);
            if (semester) {
              get().setSelectedSemester(semester);
            }

            // Load subjects for the semester
            await get().fetchSubjects(semesterId);
          }
        }
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
      throw error;
    }
  },
}));

export default useTaxonomyStore;
