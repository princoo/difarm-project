import clsx from 'clsx';
import { ReactNode } from 'react';
import { FieldError } from 'react-hook-form';

type FieldWrapperProps = {
	children: ReactNode;
	label?: string;
	error?: FieldError;
	className?: string;

};

export type FieldWrapperPassThroughProps = Omit<
	FieldWrapperProps,
	'className' | 'children'
>;

export const FieldWrapper = (props: FieldWrapperProps) => {
	const { children, label, error, className,  }:any = props;

	return (
		<div className=' flex flex-col justify-start   items-start w-full '>
			<label className={clsx('block w-full', className)}>
				{label && (
					<span  className="mb-2 block text-sm text-gray-700  dark:text-gray-400 font-medium ">
						{label}
					</span>
				)}

				<div>{children}
				
				</div>
			</label>
		
			{error?.message && (
				<span className='mt-2 block text-sm font-medium font-italics capitalize text-danger'>
					{error.message}
				</span>
			)}
		</div>
	);
};
