import { Schema, model, Document } from 'mongoose';

export interface IWorkflowStep extends Document {
    step_key: string;
    step_name: string;
    description: string;
    step_order: number;
    is_enabled: boolean;
    is_mandatory: boolean;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>({
    step_key: { type: String, required: true, unique: true },
    step_name: { type: String, required: true },
    description: { type: String, required: true },
    step_order: { type: Number, required: true },
    is_enabled: { type: Boolean, required: true, default: true },
    is_mandatory: { type: Boolean, required: true, default: false },
});

export const WorkflowStep = model<IWorkflowStep>('WorkflowStep', WorkflowStepSchema);
