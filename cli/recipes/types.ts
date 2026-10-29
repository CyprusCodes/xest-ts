export interface UserVariables {
  [key: string]: any;
}

export interface SourceFileContext {
  sourceFileName: string;
  sourceFilePath: string;
  sourceFileParentDirectory: string;
  projectRootPath: string;
  projectName: string;
  userVariables: UserVariables;
}

export interface TargetFileNameMapperContext extends SourceFileContext {
  sourceFileRelative: string;
}

export interface TargetFileWriterContext<TTarget> extends SourceFileContext {
  targetFilePath: TTarget;
}

export interface FileDescriptor<TTarget> {
  source: string;
  targetFileNameMapper: (
    context: TargetFileNameMapperContext
  ) => TTarget | null | Promise<TTarget | null>;
  targetFileWriter: (context: TargetFileWriterContext<TTarget>) => void;
}

export interface Recipe<TTarget> {
  name: string;
  userPrompt: (
    projectRootPath: string
  ) => UserVariables | void | Promise<UserVariables | void>;
  files: Array<FileDescriptor<TTarget>>;
  postGeneration?: () => void | Promise<void>;
}
