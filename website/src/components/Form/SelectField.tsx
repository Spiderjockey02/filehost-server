import type { SelectFieldProps } from '@/types/Components/Form';

export default function SelectField({ errorMsg, title, name, options, onChange }: SelectFieldProps) {
	return (
		<div className={errorMsg == undefined ? 'mb-3' : 'mb-1'}>
			<label htmlFor={name} className="form-label">{title}:</label>
			<select id="ListenerType" className="form-select" aria-label="Default select example" onChange={onChange}>
				{options.map(o => (
					<option value={o.value} key={o.value}>{o.label}</option>
				))}
			</select>
			{errorMsg && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
		</div>
	);
}