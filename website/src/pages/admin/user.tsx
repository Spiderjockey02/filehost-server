import FileNavBar from '../../components/navbars/file-navBar';
import SideBar from '../../components/navbars/sideBar';
import { fetchAllUsers } from '../../db/User';
import type { User } from '@prisma/client';

interface Props {
	users: Array<User>
}

export default function Files({ users }: Props) {
	console.log(users);
	return (
		<div className="wrapper">
			<SideBar size={0}/>
		 <div className="container-fluid" id="content">
			 <FileNavBar />
			 &nbsp;
			 <h3>User Information</h3>
			 &nbsp;
			 <div className="row">
				 <div className="col-xl-3 col-md-6 mb-4">
					 <div className="card border-left-primary shadow h-100 py-2">
						 <div className="card-body">
							 <div className="row no-gutters align-items-center">
								 <div className="col mr-2">
									 <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
										 Users
									 </div>
									 <div className="h5 mb-0 font-weight-bold text-gray-800">0</div>
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
										0
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
										 Total storage (0)
									 </div>
									 <div className="row no-gutters align-items-center">
										 <div className="col-auto">
											 <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">0</div>
										 </div>
										 <div className="col">
											 <div className="progress progress-sm mr-2">
												 <div className="progress-bar bg-info" role="progressbar"
													 style={{ width: '10%' }} aria-valuenow={1} aria-valuemin={0}
													 aria-valuemax={10}></div>
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
									 <div className="h5 mb-0 font-weight-bold text-gray-800">0</div>
								 </div>
								 <div className="col-auto">
									 <i className="fas fa-comments fa-2x text-gray-300"></i>
								 </div>
							 </div>
						 </div>
					 </div>
				 </div>
			 </div>
			 <div className="row">
				 <div className="col-xl-3 col-md-6 col-lg-6 mb-4">
					 <div className="card shadow mb-4">
						 <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							 <h6 className="m-0 font-weight-bold text-primary">User connections</h6>
						 </div>
						 <div className="card-body">
							 <div className="chart-pie pt-4 pb-2">
								 <canvas id="userConnections"></canvas>
							 </div>
							 <div className="mt-4 text-center small">
								 <span className="mr-2">
									 <i className="fas fa-circle" style={{ color: '#ea4335' }}></i> Google
								 </span>
								 <span className="mr-2">
								 <i className="fas fa-circle" style={{ color: '#3b5998' }}></i> Facebook
								 </span>
								 <span className="mr-2">
								 <i className="fas fa-circle" style={{ color: '#1da1f2' }}></i> Twitter
								 </span>
								 <span className="mr-2">
								 <i className="fas fa-circle" style={{ color: '#99aab5' }}></i> Email
								 </span>
							 </div>
						 </div>
					 </div>
				 </div>
				 <div className="col-xl-6 col-md-6 col-lg-6 mb-4">
					 <div className="card shadow mb-4">
						 <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							 <h6 className="m-0 font-weight-bold text-primary">User growth</h6>
						 </div>
						 <div className="card-body">
							 <div className="chart-area">
								 <canvas id="myAreaChart"></canvas>
							 </div>
						 </div>
					 </div>
				 </div>
				 <div className="col-xl-3 col-md-6 col-lg-6 mb-4">
					 <div className="card shadow mb-4">
						 <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							 <h6 className="m-0 font-weight-bold text-primary">User verification</h6>
						 </div>
						 <div className="card-body">
							 <div className="chart-pie pt-4 pb-2">
								 <canvas id="userverification"></canvas>
							 </div>
							 <div className="mt-4 text-center small">
								 <span className="mr-2">
								 <i className="fas fa-circle text-primary"></i> Verified
								 </span>
								 <span className="mr-2">
								 <i className="fas fa-circle text-success"></i> Not-verified
								 </span>
							 </div>
						 </div>
					 </div>
				 </div>
			 </div>
			 <table className="table table-responsive-sm table-hover" id="myTable">
				 <thead>
					 <tr>
						 <th>ID <i className="bi bi-arrow-down-up"></i></th>
						 <th>Date <i className="bi bi-arrow-down-up"></i></th>
						 <th>Name <i className="bi bi-arrow-down-up"></i></th>
						 <th>Email <i className="bi bi-arrow-down-up"></i></th>
						 <th>Tier <i className="bi bi-arrow-down-up"></i></th>
						 <th>Connections <i className="bi bi-arrow-down-up"></i></th>
						 <th>filesize <i className="bi bi-arrow-down-up"></i></th>
						 <th>Options <i className="bi bi-arrow-down-up"></i></th>
					 </tr>
				 </thead>
				 <tbody>
				 	{users.map(u => (
							<tr key={u.id}>
								<th>{u.id}</th>
								<th>{new Date(u.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</th>
								<th>{u.name}</th>
								<th>{u.email}</th>
							</tr>
						))}
				 </tbody>
			 </table>
			 <div className="modal fade" id="deleteAccount" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
				 <div className="modal-dialog" role="document">
					 <div className="modal-content">
						 <div className="modal-header">
							 <h5 className="modal-title" id="exampleModalLabel">Delete account</h5>
							 <button type="button" className="close" data-dismiss="modal" aria-label="Close">
							 <span aria-hidden="true">&times;</span>
							 </button>
						 </div>
						 <div className="modal-body">
							 <p className="debug-url"></p>
						 </div>
						 <div className="modal-footer">
							 <form className="account-delete" action="/api/account/delete" method="post">
								 <input name="custID" className="deleteID" type="hidden" value="{{USERID}}" />
								 <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
								 <button type="submit" className="btn btn-danger">Confirm</button>
							 </form>
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
		const users = await fetchAllUsers();
		return { props: { users: users.map(u => ({ ...u, createdAt: new Date(u.createdAt).getTime() })) } };
	} catch (err) {
		return { props: { data: null } };
	}
}
