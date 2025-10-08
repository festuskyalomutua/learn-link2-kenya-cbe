server/services/aiRecommendationEngine.js:

const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const compromise = require('compromise');
const brain = require('brain.js');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const Analytics = require('../models/Analytics');

class AIRecommendationEngine {
  constructor() {
    this.competencyModel = null;
    this.learningPathModel = null;
    this.contentModel = null;
    this.initializeModels();
  }

  async initializeModels() {
    // Initialize neural networks for different recommendation types
    this.competencyModel = new brain.NeuralNetwork({
      hiddenLayers: [10, 8, 6],
      activation: 'sigmoid'
    });

    this.learningPathModel = new brain.recurrent.LSTM({
      hiddenLayers: [20, 15],
      inputSize: 10,
      outputSize: 5
    });

    await this.trainModels();
  }

  async trainModels() {
    try {
      // Get training data from historical assessments
      const trainingData = await this.prepareTrainingData();
      
      // Train competency prediction model
      if (trainingData.competencyData.length > 0) {
        this.competencyModel.train(trainingData.competencyData, {
          iterations: 2000,
          errorThresh: 0.005,
          learningRate: 0.3
        });
      }

      // Train learning path model
      if (trainingData.pathData.length > 0) {
        this.learningPathModel.train(trainingData.pathData, {
          iterations: 1000,
          errorThresh: 0.01
        });
      }

      console.log('AI models trained successfully');
    } catch (error) {
      console.error('Error training AI models:', error);
    }
  }

  async prepareTrainingData() {
    const users = await User.find().populate('competencies');
    const assessments = await Assessment.find().populate('submissions');
    
    const competencyData = [];
    const pathData = [];

    for (const user of users) {
      // Prepare competency prediction data
      const userCompetencies = user.competencies.map(c => c.level / 4); // Normalize to 0-1
      const userPerformance = await this.getUserPerformanceMetrics(user._id);
      
      competencyData.push({
        input: {
          currentLevels: userCompetencies,
          timeSpent: userPerformance.avgTimeSpent / 3600, // Normalize hours
          assessmentCount: Math.min(userPerformance.assessmentCount / 50, 1),
          avgScore: userPerformance.avgScore / 100
        },
        output: {
          nextCompetencyLevel: Math.min((userPerformance.avgScore + 10) / 100, 1)
        }
      });

      // Prepare learning path data
      const learningSequence = await this.getUserLearningSequence(user._id);
      if (learningSequence.length > 1) {
        pathData.push(learningSequence);
      }
    }

    return { competencyData, pathData };
  }

  async generatePersonalizedRecommendations(userId) {
    try {
      const user = await User.findById(userId).populate('competencies');
      const userMetrics = await this.getUserPerformanceMetrics(userId);
      
      const recommendations = {
        competencyFocus: await this.recommendCompetencyFocus(user, userMetrics),
        learningPath: await this.recommendLearningPath(user, userMetrics),
        resources: await this.recommendResources(user, userMetrics),
        assessments: await this.recommendAssessments(user, userMetrics),
        studySchedule: await this.generateStudySchedule(user, userMetrics),
        interventions: await this.identifyInterventions(user, userMetrics)
      };

      // Store recommendation for analytics
      await this.logRecommendation(userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getFallbackRecommendations(userId);
    }
  }

  async recommendCompetencyFocus(user, metrics) {
    const competencyInput = {
      currentLevels: user.competencies.map(c => c.level / 4),
      timeSpent: metrics.avgTimeSpent / 3600,
      assessmentCount: Math.min(metrics.assessmentCount / 50, 1),
      avgScore: metrics.avgScore / 100
    };

    const prediction = this.competencyModel.run(competencyInput);
    
    // Identify weakest competencies for focus
    const competencyGaps = user.competencies.map((comp, index) => ({
      name: comp.name,
      currentLevel: comp.level,
      predictedImprovement: prediction.nextCompetencyLevel * 4,
      gap: (prediction.nextCompetencyLevel * 4) - comp.level,
      priority: this.calculatePriority(comp, metrics)
    }));

    return competencyGaps
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
      .map(comp => ({
        competency: comp.name,
        currentLevel: comp.currentLevel,
        targetLevel: Math.min(comp.currentLevel + 1, 4),
        priority: comp.priority > 0.7 ? 'High' : comp.priority > 0.4 ? 'Medium' : 'Low',
        estimatedTimeToImprove: this.estimateImprovementTime(comp),
        recommendedActions: this.getCompetencyActions(comp)
      }));
  }

  async recommendLearningPath(user, metrics) {
    const currentState = this.encodeUserState(user, metrics);
    const pathPrediction = this.learningPathModel.run(currentState);
    
    const suggestedPath = await this.decodeLearningPath(pathPrediction, user);
    
    return {
      nextSteps: suggestedPath.slice(0, 5),
      estimatedDuration: this.calculatePathDuration(suggestedPath),
      difficulty: this.assessPathDifficulty(suggestedPath, user),
      adaptiveAdjustments: await this.getAdaptiveAdjustments(user, suggestedPath)
    };
  }

  async recommendResources(user, metrics) {
    const userPreferences = await this.analyzeUserPreferences(user._id);
    const competencyNeeds = await this.identifyCompetencyNeeds(user);
    
    const resources = await this.findMatchingResources(competencyNeeds, userPreferences);
    
    return resources.map(resource => ({
      ...resource,
      relevanceScore: this.calculateRelevanceScore(resource, user, metrics),
      estimatedEngagement: this.predictEngagement(resource, userPreferences),
      learningObjectives: this.extractLearningObjectives(resource)
    }));
  }

  async generateStudySchedule(user, metrics) {
    const availableTime = await this.estimateAvailableStudyTime(user._id);
    const competencyPriorities = await this.recommendCompetencyFocus(user, metrics);
    
    const schedule = {
      daily: this.generateDailySchedule(availableTime, competencyPriorities),
      weekly: this.generateWeeklySchedule(availableTime, competencyPriorities),
      milestones: this.generateMilestones(competencyPriorities),
      adaptiveBreaks: this.calculateOptimalBreaks(user, metrics)
    };

    return schedule;
  }

  // Advanced NLP for content analysis
  async analyzeContentComplexity(content) {
    const doc = compromise(content);
    
    const metrics = {
      readabilityScore: this.calculateReadabilityScore(content),
      conceptDensity: this.calculateConceptDensity(doc),
      vocabularyLevel: this.assessVocabularyLevel(doc),
      cognitiveLoad: this.estimateCognitiveLoad(doc),
      prerequisites: this.identifyPrerequisites(doc)
    };

    return metrics;
  }

  calculateReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);
    
    // Flesch Reading Ease Score
    return 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  }

  // Predictive analytics for student success
  async predictStudentSuccess(userId, assessmentId) {
    const user = await User.findById(userId);
    const assessment = await Assessment.findById(assessmentId);
    const historicalData = await this.getUserHistoricalPerformance(userId);
    
    const features = {
      competencyAlignment: this.calculateCompetencyAlignment(user, assessment),
      preparationTime: historicalData.avgPreparationTime,
      previousPerformance: historicalData.avgScore,
      difficultyMatch: this.assessDifficultyMatch(user, assessment),
      engagementLevel: historicalData.engagementScore
    };

    const successProbability = this.competencyModel.run(features);
    
    return {
      successProbability: successProbability * 100,
      confidenceInterval: this.calculateConfidenceInterval(successProbability),
      riskFactors: this.identifyRiskFactors(features),
      recommendations: this.generateSuccessRecommendations(features, successProbability)
    };
  }

  // Helper methods
  calculatePriority(competency, metrics) {
    const levelWeight = (4 - competency.level) / 4; // Lower levels get higher priority
    const performanceWeight = (100 - metrics.avgScore) / 100;
    const timeWeight = Math.min(metrics.avgTimeSpent / 7200, 1); // 2 hours max
    
    return (levelWeight * 0.4) + (performanceWeight * 0.4) + (timeWeight * 0.2);
  }

  async getUserPerformanceMetrics(userId) {
    const analytics = await Analytics.find({ 
      userId, 
      type: 'assessment_performance' 
    }).sort({ timestamp: -1 }).limit(50);

    if (analytics.length === 0) {
      return {
        avgScore: 70,
        avgTimeSpent: 3600,
        assessmentCount: 0,
        engagementScore: 0.5
      };
    }

    const avgScore = analytics.reduce((sum, a) => sum + a.data.score, 0) / analytics.length;
    const avgTimeSpent = analytics.reduce((sum, a) => sum + (a.data.timeSpent || 3600), 0) / analytics.length;
    
    return {
      avgScore,
      avgTimeSpent,
      assessmentCount: analytics.length,
      engagementScore: this.calculateEngagementScore(analytics)
    };
  }

  calculateEngagementScore(analytics) {
    // Calculate based on consistency, improvement trend, and time investment
    const consistency = this.calculateConsistency(analytics);
    const improvement = this.calculateImprovementTrend(analytics);
    const timeInvestment = this.calculateTimeInvestment(analytics);
    
    return (consistency * 0.4) + (improvement * 0.3) + (timeInvestment * 0.3);
  }
}

module.exports = new AIRecommendationEngine();

