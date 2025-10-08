External Educational System Integrations
server/integrations/educationalSystems.js:

const axios = require('axios');
const xml2js = require('xml2js');
const crypto = require('crypto');

class EducationalSystemIntegrations {
  constructor() {
    this.integrations = new Map();
    this.initializeIntegrations();
  }

  initializeIntegrations() {
    // Google Classroom Integration
    this.integrations.set('google_classroom', {
      name: 'Google Classroom',
      apiBase: 'https://classroom.googleapis.com/v1',
      authType: 'oauth2',
      scopes: ['https://www.googleapis.com/auth/classroom.courses.readonly']
    });

    // Canvas LMS Integration
    this.integrations.set('canvas', {
      name: 'Canvas LMS',
      apiBase: 'https://canvas.instructure.com/api/v1',
      authType: 'token',
      endpoints: {
        courses: '/courses',
        assignments: '/courses/{course_id}/assignments',
        submissions: '/courses/{course_id}/assignments/{assignment_id}/submissions'
      }
    });

    // Moodle Integration
    this.integrations.set('moodle', {
      name: 'Moodle',
      apiBase: '/webservice/rest/server.php',
      authType: 'token',
      format: 'json'
    });

    // Microsoft Teams for Education
    this.integrations.set('teams_education', {
      name: 'Microsoft Teams for Education',
      apiBase: 'https://graph.microsoft.com/v1.0',
      authType: 'oauth2',
      scopes: ['https://graph.microsoft.com/EduRoster.Read']
    });

    // Khan Academy Integration
    this.integrations.set('khan_academy', {
      name: 'Khan Academy',
      apiBase: 'https://www.khanacademy.org/api/v1',
      authType: 'oauth',
      endpoints: {
        user: '/user',
        progress: '/user/exercises',
        badges: '/user/badges'
      }
    });
  }

  // Google Classroom Integration
  async syncWithGoogleClassroom(accessToken, courseId) {
    try {
      const config = this.integrations.get('google_classroom');
      const headers = { Authorization: `Bearer ${accessToken}` };

      // Get course information
      const courseResponse = await axios.get(
        `${config.apiBase}/courses/${courseId}`,
        { headers }
      );

      // Get students
      const studentsResponse = await axios.get(
        `${config.apiBase}/courses/${courseId}/students`,
        { headers }
      );

      // Get assignments
      const assignmentsResponse = await axios.get(
        `${config.apiBase}/courses/${courseId}/courseWork`,
        { headers }
      );

      // Sync data to CBE platform
      const syncResult = await this.syncClassroomData({
        course: courseResponse.data,
        students: studentsResponse.data.students || [],
        assignments: assignmentsResponse.data.courseWork || []
      });

      return {
        success: true,
        syncedData: syncResult,
        message: 'Google Classroom data synced successfully'
      };
    } catch (error) {
      console.error('Google Classroom sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Canvas LMS Integration
  async syncWithCanvas(apiToken, canvasUrl, courseId) {
    try {
      const config = this.integrations.get('canvas');
      const baseUrl = `${canvasUrl}/api/v1`;
      const headers = { Authorization: `Bearer ${apiToken}` };

      // Get course data
      const courseData = await axios.get(`${baseUrl}/courses/${courseId}`, { headers });
      
      // Get enrollments
      const enrollments = await axios.get(
        `${baseUrl}/courses/${courseId}/enrollments`,
        { headers }
      );

      // Get assignments
      const assignments = await axios.get(
        `${baseUrl}/courses/${courseId}/assignments`,
        { headers }
      );

      // Get submissions for each assignment
      const submissionsData = [];
      for (const assignment of assignments.data) {
        const submissions = await axios.get(
          `${baseUrl}/courses/${courseId}/assignments/${assignment.id}/submissions`,
          { headers }
        );
        submissionsData.push({
          assignment: assignment,
          submissions: submissions.data
        });
      }

      // Convert Canvas data to CBE format
      const cbeData = await this.convertCanvasDataToCBE({
        course: courseData.data,
        enrollments: enrollments.data,
        assignments: assignments.data,
        submissions: submissionsData
      });

      // Import to CBE platform
      const importResult = await this.importExternalData(cbeData, 'canvas');

      return {
        success: true,
        importedData: importResult,
        message: 'Canvas LMS data imported successfully'
      };
    } catch (error) {
      console.error('Canvas sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Moodle Integration
  async syncWithMoodle(moodleUrl, token, courseId) {
    try {
      const config = this.integrations.get('moodle');
      const baseUrl = `${moodleUrl}${config.apiBase}`;

      // Get course information
      const courseInfo = await this.moodleApiCall(baseUrl, token, 'core_course_get_courses', {
        options: { ids: [courseId] }
      });

      // Get enrolled users
      const enrolledUsers = await this.moodleApiCall(baseUrl, token, 'core_enrol_get_enrolled_users', {
        courseid: courseId
      });

      // Get course modules (assignments, quizzes, etc.)
      const courseModules = await this.moodleApiCall(baseUrl, token, 'core_course_get_contents', {
        courseid: courseId
      });

      // Get grades
      const grades = await this.moodleApiCall(baseUrl, token, 'core_grades_get_grades', {
        courseid: courseId
      });

      // Process and sync data
      const processedData = await this.processMoodleData({
        course: courseInfo[0],
        users: enrolledUsers,
        modules: courseModules,
        grades: grades
      });

      const syncResult = await this.importExternalData(processedData, 'moodle');

      return {
        success: true,
        syncedData: syncResult,
        message: 'Moodle data synced successfully'
      };
    } catch (error) {
      console.error('Moodle sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async moodleApiCall(baseUrl, token, functionName, params) {
    const response = await axios.post(baseUrl, null, {
      params: {
        wstoken: token,
        wsfunction: functionName,
        moodlewsrestformat: 'json',
        ...params
      }
    });

    if (response.data.exception) {
      throw new Error(response.data.message);
    }

    return response.data;
  }

  // Microsoft Teams for Education Integration
  async syncWithTeamsEducation(accessToken, classId) {
    try {
      const config = this.integrations.get('teams_education');
      const headers = { Authorization: `Bearer ${accessToken}` };

      // Get class information
      const classInfo = await axios.get(
        `${config.apiBase}/education/classes/${classId}`,
        { headers }
      );

      // Get class members
      const members = await axios.get(
        `${config.apiBase}/education/classes/${classId}/members`,
        { headers }
      );

      // Get assignments
      const assignments = await axios.get(
        `${config.apiBase}/education/classes/${classId}/assignments`,
        { headers }
      );

      // Get submissions
      const submissionsData = [];
      for (const assignment of assignments.data.value) {
        const submissions = await axios.get(
          `${config.apiBase}/education/classes/${classId}/assignments/${assignment.id}/submissions`,
          { headers }
        );
        submissionsData.push({
          assignment,
          submissions: submissions.data.value
        });
      }

      // Convert to CBE format and import
      const cbeData = await this.convertTeamsDataToCBE({
        class: classInfo.data,
        members: members.data.value,
        assignments: assignments.data.value,
        submissions: submissionsData
      });

      const importResult = await this.importExternalData(cbeData, 'teams_education');

      return {
        success: true,
        importedData: importResult,
        message: 'Teams for Education data synced successfully'
      };
    } catch (error) {
      console.error('Teams Education sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Khan Academy Integration
  async syncWithKhanAcademy(oauthToken, oauthSecret, userId) {
    try {
      const config = this.integrations.get('khan_academy');
      
      // Get user progress
      const userProgress = await this.khanAcademyApiCall(
        `${config.apiBase}/user/exercises`,
        oauthToken,
        oauthSecret
      );

      // Get user badges
      const userBadges = await this.khanAcademyApiCall(
        `${config.apiBase}/user/badges`,
        oauthToken,
        oauthSecret
      );

      // Convert Khan Academy progress to CBE competencies
      const competencyMapping = await this.mapKhanAcademyToCBE(userProgress, userBadges);

      // Update user competencies in CBE platform
      const updateResult = await this.updateUserCompetencies(userId, competencyMapping);

      return {
        success: true,
        updatedCompetencies: updateResult,
        message: 'Khan Academy progress synced successfully'
      };
    } catch (error) {
      console.error('Khan Academy sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Data conversion methods
  async convertCanvasDataToCBE(canvasData) {
    const cbeData = {
      course: {
        name: canvasData.course.name,
        code: canvasData.course.course_code,
        description: canvasData.course.public_description
      },
      students: canvasData.enrollments
        .filter(e => e.type === 'StudentEnrollment')
        .map(e => ({
          externalId: e.user.id,
          name: e.user.name,
          email: e.user.login_id
        })),
      assessments: canvasData.assignments.map(a => ({
        externalId: a.id,
        title: a.name,
        description: a.description,
        dueDate: a.due_at,
        points: a.points_possible,
        competencies: await this.extractCompetenciesFromDescription(a.description)
      })),
      submissions: canvasData.submissions.flatMap(s => 
        s.submissions.map(sub => ({
          assessmentId: s.assignment.id,
          studentId: sub.user_id,
          score: sub.score,
          submittedAt: sub.submitted_at,
          gradedAt: sub.graded_at
        }))
      )
    };

    return cbeData;
  }

  async mapKhanAcademyToCBE(userProgress, userBadges) {
    const competencyMapping = {
      'Problem Solving': 0,
      'Mathematical Reasoning': 0,
      'Critical Thinking': 0,
      'Communication': 0
    };

    // Map Khan Academy exercises to CBE competencies
    for (const exercise of userProgress) {
      const competency = this.getCompetencyFromExercise(exercise.exercise);
      if (competency && competencyMapping.hasOwnProperty(competency)) {
        const level = this.calculateCompetencyLevel(exercise);
        competencyMapping[competency] = Math.max(competencyMapping[competency], level);
      }
    }

    // Factor in badges for additional competency evidence
    for (const badge of userBadges) {
      const competencyBoost = this.getCompetencyBoostFromBadge(badge);
      for (const [competency, boost] of Object.entries(competencyBoost)) {
        if (competencyMapping.hasOwnProperty(competency)) {
          competencyMapping[competency] = Math.min(4, competencyMapping[competency] + boost);
        }
      }
    }

    return competencyMapping;
  }

  // Utility methods
  getCompetencyFromExercise(exerciseName) {
    const exerciseCompetencyMap = {
      'algebra': 'Mathematical Reasoning',
      'geometry': 'Problem Solving',
      'statistics': 'Critical Thinking',
      'calculus': 'Mathematical Reasoning'
    };

    for (const [key, competency] of Object.entries(exerciseCompetencyMap)) {
      if (exerciseName.toLowerCase().includes(key)) {
        return competency;
      }
    }

    return null;
  }

  calculateCompetencyLevel(exercise) {
    const proficiency = exercise.proficient_date ? 4 : 
                       exercise.practiced_date ? 3 :
                       exercise.struggling ? 1 : 2;
    return proficiency;
  }

  async extractCompetenciesFromDescription(description) {
    // Use NLP to extract competencies from assignment descriptions
    const competencyKeywords = {
      'Problem Solving': ['solve', 'problem', 'solution', 'analyze'],
      'Critical Thinking': ['evaluate', 'assess', 'critique', 'judge'],
      'Communication': ['explain', 'describe', 'present', 'communicate'],
      'Mathematical Reasoning': ['calculate', 'prove', 'derive', 'reason']
    };

    const extractedCompetencies = [];
    const lowerDescription = description.toLowerCase();

    for (const [competency, keywords] of Object.entries(competencyKeywords)) {
      const matchCount = keywords.filter(keyword => 
        lowerDescription.includes(keyword)
      ).length;

      if (matchCount > 0) {
        extractedCompetencies.push({
          name: competency,
          confidence: matchCount / keywords.length
        });
      }
    }

    return extractedCompetencies;
  }

  // Webhook handlers for real-time sync
  async handleGoogleClassroomWebhook(webhookData) {
    try {
      const { courseId, eventType, resourceId } = webhookData;
      
      switch (eventType) {
        case 'COURSE_WORK_CREATED':
          await this.syncNewAssignment(courseId, resourceId, 'google_classroom');
          break;
        case 'STUDENT_SUBMISSION_CREATED':
          await this.syncNewSubmission(courseId, resourceId, 'google_classroom');
          break;
        case 'GRADE_CHANGED':
          await this.syncGradeUpdate(courseId, resourceId, 'google_classroom');
          break;
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Batch sync operations
  async performBatchSync(integrations, options = {}) {
    const results = [];
    
    for (const integration of integrations) {
      try {
        let syncResult;
        
        switch (integration.type) {
          case 'google_classroom':
            syncResult = await this.syncWithGoogleClassroom(
              integration.accessToken,
              integration.courseId
            );
            break;
          case 'canvas':
            syncResult = await this.syncWithCanvas(
              integration.apiToken,
              integration.canvasUrl,
              integration.courseId
            );
            break;
          case 'moodle':
            syncResult = await this.syncWithMoodle(
              integration.moodleUrl,
              integration.token,
              integration.courseId
            );
            break;
        }

        results.push({
          integration: integration.type,
          success: syncResult.success,
          data: syncResult
        });
      } catch (error) {
        results.push({
          integration: integration.type,
          success: false,
          error: error.message
        });
      }
    }

    return {
      totalIntegrations: integrations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

module.exports = new EducationalSystemIntegrations();