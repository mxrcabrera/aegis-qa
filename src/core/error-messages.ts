/**
 * Error Messages - Actionable Error Messages with Solutions
 *
 * Purpose: Provides actionable error messages with suggested solutions
 * for common errors encountered during Aegis QA execution.
 *
 * @module core/error-messages
 * @since 2.0.0
 */

/**
 * Error category
 */
export enum ErrorCategory {
  SETUP = 'setup',
  GIT = 'git',
  TYPESCRIPT = 'typescript',
  DEPENDENCY = 'dependency',
  PERMISSION = 'permission',
  NETWORK = 'network',
  RESOURCE = 'resource',
  UNKNOWN = 'unknown',
}

/**
 * Error solution
 */
export interface ErrorSolution {
  /** Solution description */
  description: string;
  /** Command to run (if applicable) */
  command?: string;
  /** Documentation link (if applicable) */
  docsLink?: string;
}

/**
 * Error message with solutions
 */
export interface ErrorMessage {
  /** Error code */
  code: string;
  /** Error category */
  category: ErrorCategory;
  /** Error title */
  title: string;
  /** Error description */
  description: string;
  /** Suggested solutions */
  solutions: ErrorSolution[];
}

/**
 * ErrorMessages - Actionable error messages with solutions
 *
 * @class ErrorMessages
 */
export class ErrorMessages {
  private static errorDatabase: Map<string, ErrorMessage> = new Map();

  /**
   * Initializes the error database with common errors
   *
   * @private
   * @static
   */
  private static initializeErrorDatabase(): void {
    // Setup errors
    this.addError({
      code: 'SETUP_001',
      category: ErrorCategory.SETUP,
      title: 'Project root not found',
      description: 'The specified project root directory does not exist or is not accessible.',
      solutions: [
        {
          description: 'Verify the directory path is correct',
        },
        {
          description: 'Check if you have read permissions for the directory',
        },
        {
          description: 'Use "." to analyze the current directory',
        },
      ],
    });

    this.addError({
      code: 'SETUP_002',
      category: ErrorCategory.SETUP,
      title: 'No TypeScript files found',
      description: 'No .ts or .tsx files were found in the project.',
      solutions: [
        {
          description: 'Ensure the project contains TypeScript files',
        },
        {
          description: 'Check if the correct directory is being analyzed',
        },
        {
          description: 'Verify .aegisignore is not excluding all TypeScript files',
        },
      ],
    });

    // Git errors
    this.addError({
      code: 'GIT_001',
      category: ErrorCategory.GIT,
      title: 'Git not initialized',
      description: 'The project is not a git repository.',
      solutions: [
        {
          description: 'Initialize git in the project',
          command: 'git init',
        },
        {
          description: 'Or run Aegis QA in a non-git repository (some features will be limited)',
        },
      ],
    });

    this.addError({
      code: 'GIT_002',
      category: ErrorCategory.GIT,
      title: 'Git command failed',
      description: 'A git command failed to execute.',
      solutions: [
        {
          description: 'Ensure git is installed and accessible',
          command: 'git --version',
        },
        {
          description: 'Check if the repository has uncommitted changes',
          command: 'git status',
        },
        {
          description: 'Retry the operation (automatic retry is enabled)',
        },
      ],
    });

    this.addError({
      code: 'GIT_003',
      category: ErrorCategory.GIT,
      title: 'Ollama not running',
      description: 'Ollama service is not running or not accessible.',
      solutions: [
        {
          description: 'Start Ollama service',
          command: 'ollama serve',
        },
        {
          description: 'Check if Ollama is installed',
          command: 'ollama --version',
        },
        {
          description: 'Verify Ollama is running on the correct port',
        },
      ],
    });

    // TypeScript errors
    this.addError({
      code: 'TSC_001',
      category: ErrorCategory.TYPESCRIPT,
      title: 'TypeScript not installed',
      description: 'TypeScript is not installed in the project.',
      solutions: [
        {
          description: 'Install TypeScript as a dev dependency',
          command: 'npm install --save-dev typescript',
        },
        {
          description: 'Or install globally',
          command: 'npm install -g typescript',
        },
        {
          description: 'Verify tsconfig.json exists and is valid',
        },
        {
          description: 'Visit TypeScript official documentation for installation guide',
          docsLink: 'https://www.typescriptlang.org/download',
        },
      ],
    });

    this.addError({
      code: 'TSC_002',
      category: ErrorCategory.TYPESCRIPT,
      title: 'TypeScript compilation failed',
      description: 'TypeScript compiler found errors in the code.',
      solutions: [
        {
          description: 'Review the TypeScript errors and fix them',
          command: 'npx tsc --noEmit',
        },
        {
          description: 'Check tsconfig.json configuration',
        },
        {
          description: 'Ensure all dependencies are installed',
          command: 'npm install',
        },
      ],
    });

    this.addError({
      code: 'TSC_003',
      category: ErrorCategory.TYPESCRIPT,
      title: 'TypeScript AST parser fallback activated',
      description: 'TypeScript compiler failed, falling back to AST parser (less accurate).',
      solutions: [
        {
          description: 'Fix TypeScript installation issues',
          command: 'npm install --save-dev typescript',
        },
        {
          description: 'Check Node.js version compatibility',
          command: 'node --version',
        },
        {
          description: 'Review AST parser results with caution (heuristic-based)',
        },
      ],
    });

    // Dependency errors
    this.addError({
      code: 'DEP_001',
      category: ErrorCategory.DEPENDENCY,
      title: 'Node modules not found',
      description: 'node_modules directory not found or dependencies not installed.',
      solutions: [
        {
          description: 'Install project dependencies',
          command: 'npm install',
        },
        {
          description: 'Or use yarn',
          command: 'yarn install',
        },
        {
          description: 'Clear npm cache and retry',
          command: 'npm cache clean --force',
        },
      ],
    });

    this.addError({
      code: 'DEP_002',
      category: ErrorCategory.DEPENDENCY,
      title: 'Package.json not found',
      description: 'package.json not found in the project root.',
      solutions: [
        {
          description: 'Ensure you are in a valid Node.js project',
        },
        {
          description: 'Initialize a new project',
          command: 'npm init',
        },
        {
          description: 'Check if you are in the correct directory',
        },
      ],
    });

    // Permission errors
    this.addError({
      code: 'PERM_001',
      category: ErrorCategory.PERMISSION,
      title: 'Permission denied',
      description: 'Insufficient permissions to access a file or directory.',
      solutions: [
        {
          description: 'Check file/directory permissions',
          command: 'ls -la (Linux/Mac) or icacls (Windows)',
        },
        {
          description: 'Run with elevated privileges (use with caution)',
        },
        {
          description: 'Ensure the user has read access to the project',
        },
      ],
    });

    // Network errors
    this.addError({
      code: 'NET_001',
      category: ErrorCategory.NETWORK,
      title: 'Network connection failed',
      description: 'Failed to connect to a remote service or API.',
      solutions: [
        {
          description: 'Check internet connection',
        },
        {
          description: 'Verify proxy settings if behind a firewall',
        },
        {
          description: 'Retry the operation (automatic retry is enabled)',
        },
      ],
    });

    // Resource errors
    this.addError({
      code: 'RES_001',
      category: ErrorCategory.RESOURCE,
      title: 'Out of memory',
      description: 'The system ran out of memory during execution.',
      solutions: [
        {
          description: 'Increase Node.js memory limit',
          command: 'NODE_OPTIONS="--max-old-space-size=4096" aegis-qa review',
        },
        {
          description: 'Close other applications to free memory',
        },
        {
          description: 'Analyze smaller portions of the codebase',
        },
      ],
    });

    this.addError({
      code: 'RES_002',
      category: ErrorCategory.RESOURCE,
      title: 'Disk space low',
      description: 'Insufficient disk space for operation.',
      solutions: [
        {
          description: 'Free up disk space',
        },
        {
          description: 'Clean .aegis-cache directory',
          command: 'rm -rf .aegis-cache (Linux/Mac) or rmdir /s .aegis-cache (Windows)',
        },
        {
          description: 'Check available disk space',
          command: 'df -h (Linux/Mac) or Get-PSDrive (Windows)',
        },
      ],
    });

    // Thermal errors
    this.addError({
      code: 'THERM_001',
      category: ErrorCategory.RESOURCE,
      title: 'GPU temperature too high',
      description: 'GPU temperature exceeded safe threshold, cooldown activated.',
      solutions: [
        {
          description: 'Wait for GPU to cool down (automatic cooldown is active)',
        },
        {
          description: 'Check GPU cooling system',
        },
        {
          description: 'Reduce workload or disable thermal checks with --skip-thermal',
        },
      ],
    });

    // Unknown errors
    this.addError({
      code: 'UNKNOWN_001',
      category: ErrorCategory.UNKNOWN,
      title: 'Unexpected error occurred',
      description: 'An unexpected error occurred during execution.',
      solutions: [
        {
          description: 'Run with --verbose flag for more details',
        },
        {
          description: 'Check the logs for detailed error information',
        },
        {
          description: 'Report the issue on GitHub',
          docsLink: 'https://github.com/mxrcabrera/aegis-qa/issues',
        },
      ],
    });
  }

  /**
   * Adds an error to the database
   *
   * @private
   * @static
   * @param error - Error message to add
   */
  private static addError(error: ErrorMessage): void {
    this.errorDatabase.set(error.code, error);
  }

  /**
   * Gets an error message by code
   *
   * @static
   * @param code - Error code
   * @returns ErrorMessage | null - Error message or null if not found
   */
  static getError(code: string): ErrorMessage | null {
    // Initialize database if empty
    if (this.errorDatabase.size === 0) {
      this.initializeErrorDatabase();
    }

    return this.errorDatabase.get(code) || null;
  }

  /**
   * Gets an error message by pattern matching
   *
   * @static
   * @param errorMessage - Error message string
   * @returns ErrorMessage | null - Best matching error or null
   */
  static getErrorByPattern(errorMessage: string): ErrorMessage | null {
    // Initialize database if empty
    if (this.errorDatabase.size === 0) {
      this.initializeErrorDatabase();
    }

    const lowerMessage = errorMessage.toLowerCase();

    // Pattern matching for common error keywords
    if (lowerMessage.includes('git') && lowerMessage.includes('not found')) {
      return this.getError('GIT_001');
    }
    if (lowerMessage.includes('git') && lowerMessage.includes('failed')) {
      return this.getError('GIT_002');
    }
    if (lowerMessage.includes('ollama')) {
      return this.getError('GIT_003');
    }
    if (lowerMessage.includes('typescript') || lowerMessage.includes('tsc')) {
      if (lowerMessage.includes('not found') || lowerMessage.includes('not installed')) {
        return this.getError('TSC_001');
      }
      if (lowerMessage.includes('failed')) {
        return this.getError('TSC_002');
      }
      return this.getError('TSC_003');
    }
    if (lowerMessage.includes('node_modules') || lowerMessage.includes('dependency')) {
      return this.getError('DEP_001');
    }
    if (lowerMessage.includes('package.json')) {
      return this.getError('DEP_002');
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
      return this.getError('PERM_001');
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return this.getError('NET_001');
    }
    if (lowerMessage.includes('memory') || lowerMessage.includes('heap')) {
      return this.getError('RES_001');
    }
    if (lowerMessage.includes('disk') || lowerMessage.includes('space')) {
      return this.getError('RES_002');
    }
    if (lowerMessage.includes('temperature') || lowerMessage.includes('thermal') || lowerMessage.includes('gpu')) {
      return this.getError('THERM_001');
    }

    return this.getError('UNKNOWN_001');
  }

  /**
   * Formats an error message for display
   *
   * @static
   * @param error - Error message to format
   * @param verbose - Whether to include detailed information
   * @returns string - Formatted error message
   */
  static formatError(error: ErrorMessage, verbose: boolean = false): string {
    let message = `\n❌ ${error.title} [${error.code}]\n`;
    message += `   ${error.description}\n`;

    if (verbose) {
      message += `   Category: ${error.category}\n`;
    }

    message += `\n   Solutions:\n`;
    error.solutions.forEach((solution, index) => {
      message += `   ${index + 1}. ${solution.description}`;
      if (solution.command) {
        message += `\n      Command: ${solution.command}`;
      }
      if (solution.docsLink) {
        message += `\n      Docs: ${solution.docsLink}`;
      }
      message += '\n';
    });

    return message;
  }

  /**
   * Logs an error with actionable solutions
   *
   * @static
   * @param error - Error object or message
   * @param verbose - Whether to include detailed information
   */
  static logError(error: Error | string, verbose: boolean = false): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorObj = this.getErrorByPattern(errorMessage);

    if (errorObj) {
      console.log(this.formatError(errorObj, verbose));
    } else {
      console.error(`❌ Error: ${errorMessage}`);
      console.log('   Run with --verbose for more details');
    }
  }

  /**
   * Creates a custom error message
   *
   * @static
   * @param code - Error code
   * @param category - Error category
   * @param title - Error title
   * @param description - Error description
   * @param solutions - Array of solutions
   * @returns ErrorMessage - Custom error message
   */
  static createCustomError(
    code: string,
    category: ErrorCategory,
    title: string,
    description: string,
    solutions: ErrorSolution[]
  ): ErrorMessage {
    return {
      code,
      category,
      title,
      description,
      solutions,
    };
  }
}
