import FileNavBar from '../../components/navbars/file-navBar';
import SideBar from '../../components/navbars/sideBar';
import config from '../../config';
import { formatBytes } from '../../utils/functions';
import { useSession } from 'next-auth/react';
import type { User } from '@prisma/client';
import axios from 'axios';

interface Props {
	data: {
		users: {
			total: number
		},
		storage: {
			total: number
			free: number
		}
	}
}

export default function Files({ data }: Props) {
	// Make sure user is logged in before accessing page
	const { data: session, status } = useSession({ required: true });
	if (status == 'loading') return null;

	return (
		<div className="wrapper">
			<SideBar size={0} user={session.user as User}/>
	      <div className="container-fluid" id="content">
				<FileNavBar user={session.user as User}/>
	        <div id="accordion">
	          <div className="card">
	            <div className="card-header" id="headingOne">
	              <h5 className="mb-0">
	                <button className="btn btn-link" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
	                User information
	                </button>
	              </h5>
	            </div>
	            <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
	              <div className="card-body">
	                <div className="row">
	                  <div className="col-xl-3 col-md-6 mb-4">
	                    <div className="card border-left-primary shadow h-100 py-2">
	                      <div className="card-body">
	                        <div className="row no-gutters align-items-center">
	                          <div className="col mr-2">
	                            <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
	                              Users
	                            </div>
	                            <div className="h5 mb-0 font-weight-bold text-gray-800">{data.users.total ?? 0}</div>
	                          </div>
	                          <div className="col-auto">
	                            <i className="fas fa-calendar fa-2x text-gray-300"></i>
	                          </div>
	                        </div>
	                      </div>
	                    </div>
	                  </div>
	                  <div className="col-xl-3 col-md-6 mb-4">
	                    <div className="card border-left-success shadow h-100 py-2">
	                      <div className="card-body">
	                        <div className="row no-gutters align-items-center">
	                          <div className="col mr-2">
	                            <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
	                              Paying users
	                            </div>
	                            <div className="h5 mb-0 font-weight-bold text-gray-800">
	                              {data.users.total ?? 0}
	                            </div>
	                          </div>
	                          <div className="col-auto">
	                            <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
	                          </div>
	                        </div>
	                      </div>
	                    </div>
	                  </div>
	                  <div className="col-xl-3 col-md-6 mb-4">
	                    <div className="card border-left-info shadow h-100 py-2">
	                      <div className="card-body">
	                        <div className="row no-gutters align-items-center">
	                          <div className="col mr-2">
	                            <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
	                              Total storage ({formatBytes(data.storage.total)})
	                            </div>
	                            <div className="row no-gutters align-items-center">
	                              <div className="col-auto">
	                                <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">{formatBytes(data.storage.total - data.storage.free)}</div>
	                              </div>
	                              <div className="col">
	                                <div className="progress progress-sm mr-2">
	                                  <div className="progress-bar bg-info" role="progressbar"
	                                    style={{ width: `${((data.storage.total - data.storage.free) / data.storage.total) * 100}%` }} aria-valuenow={data.storage.total - data.storage.free} aria-valuemin={0}
	                                    aria-valuemax={data.storage.total}>
																	</div>
	                                </div>
	                              </div>
	                            </div>
	                          </div>
	                          <div className="col-auto">
	                            <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
	                          </div>
	                        </div>
	                      </div>
	                    </div>
	                  </div>
	                  <div className="col-xl-3 col-md-6 mb-4">
	                    <div className="card border-left-warning shadow h-100 py-2">
	                      <div className="card-body">
	                        <div className="row no-gutters align-items-center">
	                          <div className="col mr-2">
	                            <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
	                              Average storage per a user
	                            </div>
	                            <div className="h5 mb-0 font-weight-bold text-gray-800">{formatBytes((data.storage.total - data.storage.free) / data.users.total)}</div>
	                          </div>
	                          <div className="col-auto">
	                            <i className="fas fa-comments fa-2x text-gray-300"></i>
	                          </div>
	                        </div>
	                      </div>
	                    </div>
	                  </div>
	                </div>
	              </div>
	            </div>
	          </div>
	          <div className="card">
	            <div className="card-header" id="headingTwo">
	              <h5 className="mb-0">
	                <button className="btn btn-link collapsed" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
	                Collapsible Group Item #2
	                </button>
	              </h5>
	            </div>
	            <div id="collapseTwo" className="collapse" aria-labelledby="headingTwo" data-parent="#accordion">
	            </div>
	          </div>
	          <div className="card">
	            <div className="card-header" id="headingThree">
	              <h5 className="mb-0">
	                <button className="btn btn-link collapsed" data-toggle="collapse" data-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
	                Collapsible Group Item #3
	                </button>
	              </h5>
	            </div>
	            <div id="collapseThree" className="collapse" aria-labelledby="headingThree" data-parent="#accordion">
	              <div className="card-body">
	                Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably havent heard of them accusamus labore sustainable VHS.
	              </div>
	            </div>
	          </div>
	        </div>
	      </div>
	    </div>
	);
}

export async function getServerSideProps() {
	// Validate path
	try {
		const { data } = await axios.get(`${config.backendURL}/api/admin/stats`);
		return { props: { data } };
	} catch (err) {
		return { props: { data: null } };
	}
}
