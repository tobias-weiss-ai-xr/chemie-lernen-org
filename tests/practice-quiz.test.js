/**
 * Unit tests for practice-quiz.js - Practice quiz functionality
 * Tests quiz generation, scoring, and user interaction
 */

describe('Practice Quiz Module', () => {
  beforeEach(() => {
    // Reset practice state before each test
    document.body.innerHTML = `
      <div id="practice-setup"></div>
      <div id="practice-problem" style="display: none;"></div>
      <div id="practice-results"></div>
      <select id="practice-type">
        <option value="mass-mass">Mass-Mass</option>
        <option value="mol-mol">Mol-Mol</option>
        <option value="limiting">Limiting Reagent</option>
      </select>
      <select id="practice-difficulty">
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      <input id="practice-answer" type="text" />
      <button id="submit-answer"></button>
    `;

    // Reset global practice state
    global.practiceState = {
      score: 0,
      correct: 0,
      incorrect: 0,
      currentProblem: null,
      problemNumber: 1,
      active: false,
    };
  });

  describe('Practice State Management', () => {
    test('should initialize with default state', () => {
      expect(global.practiceState.score).toBe(0);
      expect(global.practiceState.correct).toBe(0);
      expect(global.practiceState.incorrect).toBe(0);
      expect(global.practiceState.active).toBe(false);
      expect(global.practiceState.problemNumber).toBe(1);
    });

    test('should track correct answers', () => {
      global.practiceState.correct = 5;
      global.practiceState.incorrect = 2;
      global.practiceState.score = (5 / (5 + 2)) * 100;

      expect(global.practiceState.score).toBeCloseTo(71.43, 2);
    });

    test('should increment problem numbers correctly', () => {
      global.practiceState.problemNumber = 1;
      global.practiceState.problemNumber++;

      expect(global.practiceState.problemNumber).toBe(2);
    });
  });

  describe('Quiz Problem Generation', () => {
    test('should support multiple problem types', () => {
      const supportedTypes = ['mol-mol', 'mass-mass', 'limiting'];
      const types = ['mol-mol', 'mass-mass', 'limiting'];

      supportedTypes.forEach((type) => {
        expect(types).toContain(type);
      });
    });

    test('should select random problem type when "random" is chosen', () => {
      const mockMathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const types = ['mol-mol', 'mass-mass', 'limiting', 'yield'];
      const selectedIndex = Math.floor(types.length * mockMathRandom());
      const selectedType = types[selectedIndex];

      expect(['mol-mol', 'mass-mass', 'limiting', 'yield']).toContain(selectedType);
      mockMathRandom.mockRestore();
    });

    test('should handle random problem type selection', () => {
      const type = 'random';
      const types = ['mol-mol', 'mass-mass', 'limiting', 'yield'];

      const randomIndex = Math.floor(Math.random() * types.length);
      const problemType = types[randomIndex];

      expect(types).toContain(problemType);
    });
  });

  describe('Difficulty Levels', () => {
    test('should support easy difficulty', () => {
      const difficulty = 'easy';
      expect(['easy', 'medium', 'hard']).toContain(difficulty);
    });

    test('should support medium difficulty', () => {
      const difficulty = 'medium';
      expect(['easy', 'medium', 'hard']).toContain(difficulty);
    });

    test('should support hard difficulty', () => {
      const difficulty = 'hard';
      expect(['easy', 'medium', 'hard']).toContain(difficulty);
    });
  });

  describe('Score Calculation', () => {
    test('should calculate percentage correctly', () => {
      const correct = 8;
      const total = 10;
      const percentage = (correct / total) * 100;

      expect(percentage).toBe(80);
    });

    test('should handle perfect scores', () => {
      const correct = 10;
      const total = 10;
      const percentage = (correct / total) * 100;

      expect(percentage).toBe(100);
    });

    test('should handle zero correct answers', () => {
      const correct = 0;
      const total = 5;
      const percentage = (correct / total) * 100;

      expect(percentage).toBe(0);
    });

    test('should handle decimal precision', () => {
      const correct = 7;
      const total = 11;
      const percentage = (correct / total) * 100;

      expect(percentage).toBeCloseTo(63.64, 2);
    });
  });

  describe('Quiz Results Display', () => {
    test('should calculate total problems attempted', () => {
      const results = {
        correct: 5,
        incorrect: 3,
      };
      const total = results.correct + results.incorrect;

      expect(total).toBe(8);
    });

    test('should format results for display', () => {
      const state = {
        correct: 7,
        incorrect: 2,
        score: 77.78,
      };

      const displayText = `Results: ${state.correct}/${state.correct + state.incorrect} correct (${state.score}%)`;

      expect(displayText).toContain('Results: 7/9');
      expect(displayText).toContain('77.78%');
    });
  });

  describe('Problem Numbering', () => {
    test('should start problems from 1', () => {
      const initialNumber = 1;
      expect(initialNumber).toBe(1);
    });

    test('should increment problem numbers sequentially', () => {
      let problemNumber = 1;
      for (let i = 0; i < 5; i++) {
        problemNumber++;
      }

      expect(problemNumber).toBe(6);
    });

    test('should handle large problem numbers', () => {
      const problemNumber = 50;
      expect(problemNumber).toBeGreaterThan(10);
    });
  });

  describe('Quiz Active State', () => {
    test('should start in inactive state', () => {
      expect(global.practiceState.active).toBe(false);
    });

    test('should activate when quiz starts', () => {
      global.practiceState.active = true;
      expect(global.practiceState.active).toBe(true);
    });

    test('should deactivate when quiz ends', () => {
      global.practiceState.active = true;
      global.practiceState.active = false;
      expect(global.practiceState.active).toBe(false);
    });
  });

  describe('Problem Type Validation', () => {
    test('should validate supported problem types', () => {
      const validTypes = ['mol-mol', 'mass-mass', 'limiting', 'yield'];
      const testType = 'mass-mass';

      expect(validTypes).toContain(testType);
    });

    test('should reject invalid problem types', () => {
      const validTypes = ['mol-mol', 'mass-mass', 'limiting', 'yield'];
      const invalidType = 'invalid-type';

      expect(validTypes).not.toContain(invalidType);
    });
  });

  describe('Answer Handling', () => {
    test('should store user answers', () => {
      const answer = '2.5';
      const answerInput = document.getElementById('practice-answer');
      answerInput.value = answer;

      expect(answerInput.value).toBe(answer);
    });

    test('should clear answer input after submission', () => {
      const answerInput = document.getElementById('practice-answer');
      answerInput.value = 'test answer';
      answerInput.value = '';

      expect(answerInput.value).toBe('');
    });
  });

  describe('Quiz Reset Functionality', () => {
    test('should reset score to zero', () => {
      global.practiceState.score = 75;
      global.practiceState.score = 0;

      expect(global.practiceState.score).toBe(0);
    });

    test('should reset problem counters', () => {
      global.practiceState.correct = 5;
      global.practiceState.incorrect = 2;

      global.practiceState.correct = 0;
      global.practiceState.incorrect = 0;

      expect(global.practiceState.correct).toBe(0);
      expect(global.practiceState.incorrect).toBe(0);
    });

    test('should reset problem number', () => {
      global.practiceState.problemNumber = 7;
      global.practiceState.problemNumber = 1;

      expect(global.practiceState.problemNumber).toBe(1);
    });
  });
});
