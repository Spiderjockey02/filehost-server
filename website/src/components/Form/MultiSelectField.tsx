import { MultiSelectFieldProps } from '@/types/Components/Form';
import Select from 'react-select';

export default function MultiSelectField({ errorMsg, name, title, defaultValue, options, onChange }: MultiSelectFieldProps) {

	console.log({ errorMsg, name, title, defaultValue, options, onChange });
	return (
		<div className={errorMsg == undefined ? 'mb-3' : 'mb-1'}>
			<label className="form-label">{title}:</label>
			<Select isMulti defaultValue={defaultValue} options={options} onChange={onChange} />
			{errorMsg && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
		</div>
	);
}

