import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { InputFieldProps } from '@/types/Components/Form';
import { useState } from 'react';
import Link from 'next/link';

export default function InputField({ title, name, type, placeholder, value, checked, onChange, errorMsg, autocomplete }: InputFieldProps) {
	const [hidden, setHidden] = useState(false);

	return (
		<div className="mb-3">
			<label htmlFor={name} className="form-label">{title}:</label>
			<div className={type == 'password' ? 'input-group' : ''}>
				<input type={type == 'password' ? (hidden ? 'text' : 'password') : type} className={type == 'checkbox' ? 'form-check-input' : 'form-control'} style={errorMsg ? { borderColor: 'red' } : {}} id={name} placeholder={placeholder} defaultValue={value} defaultChecked={checked} onChange={onChange} autoComplete={autocomplete} />
				{type == 'password' ?
					<Link onClick={() => setHidden(!hidden)} href="#" className='input-group-text'>
						{hidden ? <FontAwesomeIcon icon={faEye} width={15} height={15} /> : <FontAwesomeIcon icon={faEyeSlash} width={15} height={15} />}
					</Link>
					: null
				}
				{errorMsg && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
			</div>
		</div>
	);
}